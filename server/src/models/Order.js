import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  customer: {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    campus: { type: String, required: true, trim: true },
    deliveryNote: { type: String, default: '' }
  },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }
  }],
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Printing', 'Ready', 'Delivered', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
