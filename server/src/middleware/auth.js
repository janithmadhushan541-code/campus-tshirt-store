import jwt from 'jsonwebtoken';
import User from '../model/user.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        message: 'Please log in first.'
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);

    if (!user) {
      return res.status(401).json({
        message: 'Account not found.'
      });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      message: 'Invalid or expired login token.'
    });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Administrator access required.'
    });
  }

  next();
}