import { Router } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { customer, items } = req.body;
    if (!customer?.name || !customer?.email || !customer?.phone || !customer?.campus) {
      return res.status(400).json({ message: 'Name, email, phone, and campus are required.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty.' });
    }

    const orderItems = [];
    let total = 0;
    for (const item of items) {
      if (!mongoose.isValidObjectId(item.productId)) return res.status(400).json({ message: 'Invalid product in cart.' });
      const product = await Product.findById(item.productId);
      if (!product) return res.status(400).json({ message: 'A product in your cart no longer exists.' });
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return res.status(400).json({ message: 'Each quantity must be between 1 and 20.' });
      }
      if (!product.sizes.includes(item.size)) return res.status(400).json({ message: `Invalid size for ${product.name}.` });
      if (product.stock < quantity) return res.status(400).json({ message: `Not enough stock for ${product.name}.` });
      orderItems.push({ product: product._id, name: product.name, size: item.size, quantity, unitPrice: product.price });
      total += product.price * quantity;
    }

    // Prices are always read from MongoDB, not trusted from the browser.
    const order = await Order.create({ customer, items: orderItems, total });
    for (const item of orderItems) {
      await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } });
    }
    res.status(201).json({ message: 'Order placed successfully.', orderId: order._id, total: order.total, status: order.status });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid order ID' });
    const order = await Order.findById(req.params.id).select('-customer.phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { next(err); }
});

export default router;
