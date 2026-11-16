import mongoose from 'mongoose';
import MysqlOrder from './mysql/orderModel.js';

const isMysqlMode = () => (process.env.DB_TYPE || 'mysql').toLowerCase() === 'mysql';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true, lowercase: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, default: 'Dhaka' },
      area: { type: String, default: 'City Center' },
      deliveryType: { type: String, enum: ['home', 'office'], default: 'home' },
    },
    items: [
      {
        productId: { type: String, required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        image: { type: String },
        brand: { type: String },
      },
    ],
    delivery: {
      method: { type: String, enum: ['standard', 'express'], default: 'standard' },
      fee: { type: Number, default: 60 },
      estimatedDelivery: { type: String, default: '2 - 3 Days' },
    },
    payment: {
      method: {
        type: String,
        enum: ['bkash', 'nagad', 'rocket', 'card', 'cod'],
        default: 'cod',
      },
      status: {
        type: String,
        default: 'Pending',
      },
      transactionId: { type: String },
      accountNumber: { type: String },
      paidAt: { type: Date },
    },
    pricing: {
      subtotal: { type: Number, required: true },
      shippingFee: { type: Number, default: 60 },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    status: {
      type: String,
      enum: [
        'Order Placed',
        'Payment Verified',
        'Processing',
        'Shipped',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
      ],
      default: 'Order Placed',
    },
    timeline: [
      {
        title: { type: String, required: true },
        description: { type: String },
        time: { type: String },
        date: { type: String },
        completed: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ createdAt: -1 });

const MongooseOrder = mongoose.models.Order || mongoose.model('Order', orderSchema);

const Order = new Proxy(function () {}, {
  get(target, prop) {
    if (isMysqlMode() && MysqlOrder[prop]) {
      return MysqlOrder[prop];
    }
    const val = MongooseOrder[prop];
    return typeof val === 'function' ? val.bind(MongooseOrder) : val;
  },
  construct(target, args) {
    if (isMysqlMode()) {
      return MysqlOrder.create(...args);
    }
    return new MongooseOrder(...args);
  },
  apply(target, thisArg, args) {
    if (isMysqlMode()) {
      return MysqlOrder.create(...args);
    }
    return MongooseOrder.apply(thisArg, args);
  },
});

export default Order;
