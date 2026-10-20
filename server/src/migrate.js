import 'dotenv/config';
import mongoose from 'mongoose';
import { up } from './migrations/001_add_product_indexes.js';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_tee_store';
try {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const collection = db.collection('_migrations');
  const name = '001_add_product_indexes';
  const applied = await collection.findOne({ name });
  if (applied) {
    console.log(`Migration ${name} already applied.`);
  } else {
    await up(db);
    await collection.insertOne({ name, appliedAt: new Date() });
    console.log(`Applied migration ${name}.`);
  }
} catch (error) {
  console.error('Migration failed:', error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
