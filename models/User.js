import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { getAuthDb } from '../config/db.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: function () {
        return this.provider === 'credentials' || !this.provider;
      },
      minlength: [6, 'Password must be at least 6 characters'],
    },
    image: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    },
    phone: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['customer', 'user', 'seller', 'admin'],
      default: 'customer',
    },
    provider: {
      type: String,
      enum: ['credentials', 'google', 'github', 'oauth'],
      default: 'credentials',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret.password;
        return ret;
      },
    },
  }
);

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Retrieve User model bound strictly to the dedicated 'zaraz_auth_db' database
export const getUserModel = () => {
  const authDb = getAuthDb();
  return authDb.models.User || authDb.model('User', userSchema);
};

// Proxy export: Automatically forwards all Mongoose model operations to zaraz_auth_db.User
const User = new Proxy(function () {}, {
  get(target, prop) {
    const Model = getUserModel();
    const value = Model[prop];
    return typeof value === 'function' ? value.bind(Model) : value;
  },
  construct(target, args) {
    const Model = getUserModel();
    return new Model(...args);
  },
  apply(target, thisArg, args) {
    const Model = getUserModel();
    return Model.apply(thisArg, args);
  },
});

export default User;
