import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const router = Router();
const sessions = new Map();
const lifetime = 8 * 60 * 60 * 1000;
const loginWindow = 15 * 60 * 1000;
let loginAttempts = 0;
let resetAt = 0;
const statuses = Order.schema.path('status').enumValues;
const categories = Product.schema.path('category').enumValues;
const hash = value => createHash('sha256').update(value).digest();
const route = handler => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
const stockLimit = 5;

router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.post('/login', (req, res) => {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword || configuredPassword.length < 16) {
    return res.status(503).json({ message: 'Set ADMIN_PASSWORD to at least 16 characters on the server.' });
  }

  const now = Date.now();
  if (now >= resetAt) {
    resetAt = now + loginWindow;
    loginAttempts = 0;
  }
  if (loginAttempts >= 10) {
    res.set('Retry-After', String(Math.ceil((resetAt - now) / 1000)));
    return res.status(429).json({ message: 'Too many attempts. Try again later.' });
  }
  const password = req.body?.password;
  if (typeof password !== 'string' || !timingSafeEqual(hash(password), hash(configuredPassword))) {
    loginAttempts += 1;
    return res.status(401).json({ message: 'Incorrect admin password.' });
  }

  for (const [token, expiry] of sessions) {
    if (expiry <= now) sessions.delete(token);
  }
  if (sessions.size >= 100) return res.status(429).json({ message: 'Too many active sessions.' });
  const token = randomBytes(32).toString('hex');
  sessions.set(token, now + lifetime);
  res.json({ token });
});

router.use((req, res, next) => {
  const token = req.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  const expiry = sessions.get(token);
  if (!expiry || expiry <= Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ message: 'Please sign in to continue.' });
  }
  req.adminToken = token;
  next();
});

router.post('/logout', (req, res) => {
  sessions.delete(req.adminToken);
  res.sendStatus(204);
});

router.get('/overview', route(async (_req, res) => {
  const [groups, lowStock, products] = await Promise.all([
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$total' } } }]),
    Product.countDocuments({ stock: { $lte: stockLimit } }),
    Product.estimatedDocumentCount()
  ]);
  res.json({
    orders: groups.reduce((total, group) => total + group.count, 0),
    pending: groups.find(group => group._id === 'Pending')?.count ?? 0,
    deliveredValue: groups.find(group => group._id === 'Delivered')?.total ?? 0,
    lowStock, products, stockLimit
  });
}));

router.get('/orders', route(async (req, res) => {
  const { status, search } = req.query;
  const filter = {};
  if (statuses.includes(status)) filter.status = status;
  if (typeof search === 'string' && search.trim()) {
    const query = search.trim().slice(0, 120);
    const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ 'customer.name': pattern }, { 'customer.email': pattern }];
    if (mongoose.isObjectIdOrHexString(query)) filter.$or.push({ _id: query });
  }
  const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1));
  const limit = 20;
  const count = await Order.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(count / limit));
  const currentPage = Math.min(page, pages);
  const orders = await Order.find(filter).sort({ createdAt: -1, _id: -1 })
    .skip((currentPage - 1) * limit).limit(limit).lean();
  res.json({ orders, page: currentPage, pages, count });
}));

router.patch('/orders/:id', route(async (req, res) => {
  const { status, previousStatus } = req.body ?? {};
  if (!mongoose.isObjectIdOrHexString(req.params.id) || !statuses.includes(status) || !statuses.includes(previousStatus)) {
    return res.status(400).json({ message: 'Select a valid order and status.' });
  }
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, status: previousStatus },
    { $set: { status } },
    { new: true, runValidators: true }
  );
  if (!order) return res.status(409).json({ message: 'The order changed. Refresh and try again.' });
  res.json(order);
}));

router.get('/products', route(async (_req, res) => {
  res.json(await Product.find().sort({ name: 1 }).lean());
}));

function productData(body = {}) {
  const { name, description, category, image, sizes, stock, price, featured } = body ?? {};
  if (typeof name !== 'string' || !name.trim() || name.length > 120 ||
    typeof description !== 'string' || description.length > 2000 ||
    !categories.includes(category) || typeof image !== 'string' || image.length > 2048 ||
    !Array.isArray(sizes) || sizes.length < 1 || sizes.length > 20 ||
    !sizes.every(size => typeof size === 'string' && size.trim() && size.length <= 24) ||
    !Number.isSafeInteger(stock) || stock < 0 || !Number.isFinite(price) || price < 0 ||
    typeof featured !== 'boolean') return null;

  if (image) {
    try {
      if (!['http:', 'https:'].includes(new URL(image).protocol)) return null;
    } catch {
      return null;
    }
  }
  return { name: name.trim(), description: description.trim(), category, image,
    sizes: [...new Set(sizes.map(size => size.trim()))], stock, price, featured };
}

router.post('/products', route(async (req, res) => {
  const data = productData(req.body);
  if (!data) return res.status(400).json({ message: 'Check the product fields, sizes, stock and image URL.' });
  res.status(201).json(await Product.create(data));
}));

router.patch('/products/:id', route(async (req, res) => {
  const data = productData(req.body);
  const { previousStock, previousUpdate } = req.body ?? {};
  if (!data || !mongoose.isObjectIdOrHexString(req.params.id) || !Number.isSafeInteger(previousStock) ||
    (previousUpdate != null && (typeof previousUpdate !== 'string' || !Number.isFinite(Date.parse(previousUpdate))))) {
    return res.status(400).json({ message: 'Check the product fields, sizes, stock and image URL.' });
  }
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, stock: previousStock, updatedAt: previousUpdate ?? null },
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!product) return res.status(409).json({ message: 'The product changed since you opened it. Refresh and try again.' });
  res.json(product);
}));

export default router;
