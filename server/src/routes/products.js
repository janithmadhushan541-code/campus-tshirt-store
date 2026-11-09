
import { Router } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

const router = Router();

// GET /api/products
// Get all products, with optional search and category filters
router.get('/', async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (search && String(search).trim()) {
      const searchText = String(search).trim();

      // Escape special regex characters supplied by the user
      const escapedSearch = searchText.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );

      filter.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    if (category && String(category).trim()) {
      filter.category = String(category).trim();
    }

    const products = await Product.find(filter).sort({
      createdAt: -1
    });

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id
// Get one product by its MongoDB ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: 'Invalid product ID.'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: 'Product not found.'
      });
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
});

export default router;
