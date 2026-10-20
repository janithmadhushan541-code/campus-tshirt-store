import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, enum: ['Campus', 'Sports', 'Event', 'Accessories'], default: 'Campus' },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: '' },
  sizes: { type: [String], default: ['S', 'M', 'L', 'XL'] },
  stock: { type: Number, default: 0, min: 0 },
  featured: { type: Boolean, default: false }
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text' });
export default mongoose.model('Product', productSchema);
