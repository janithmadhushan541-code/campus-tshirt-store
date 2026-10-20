import 'dotenv/config';
import mongoose from 'mongoose';
import Product from './models/Product.js';

const products = [
  { name: 'Ruhuna Campus Classic Tee', description: 'Soft everyday T-shirt with a clean campus-inspired design.', category: 'Campus', price: 1800, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80', sizes: ['S','M','L','XL','XXL'], stock: 100, featured: true },
  { name: 'Faculty Sports Jersey', description: 'Lightweight jersey for inter-faculty matches and team days.', category: 'Sports', price: 2600, image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80', sizes: ['S','M','L','XL'], stock: 60, featured: true },
  { name: 'Batch Event T-Shirt', description: 'Custom batch and event T-shirt. Add event details in the order note.', category: 'Event', price: 2000, image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80', sizes: ['S','M','L','XL','XXL'], stock: 120, featured: true },
  { name: 'Campus Cap', description: 'Simple cap for campus events and sports days.', category: 'Accessories', price: 1200, image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=80', sizes: ['One Size'], stock: 40, featured: false },
  { name: 'Engineering Club Tee', description: 'A club T-shirt for project showcases and meetups.', category: 'Campus', price: 1900, image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80', sizes: ['S','M','L','XL','XXL'], stock: 75, featured: false },
  { name: 'Tournament Supporter Tee', description: 'Wear your team colours on match day.', category: 'Sports', price: 1700, image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=80', sizes: ['S','M','L','XL'], stock: 90, featured: false }
];

try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_tee_store');
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products.`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
