import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student'
    },
    university: {
      type: String,
      default: 'University of Ruhuna'
    }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);