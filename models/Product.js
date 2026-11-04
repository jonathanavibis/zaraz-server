import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be positive'],
    },
    originalPrice: {
      type: Number,
      default: function () {
        return this.price;
      },
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
    },
    soldCount: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: [true, 'Category name is required'],
    },
    categorySlug: {
      type: String,
      required: true,
      lowercase: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
    },
    isFlashSale: {
      type: Boolean,
      default: false,
    },
    isFreeDelivery: {
      type: Boolean,
      default: false,
    },
    isOfficial: {
      type: Boolean,
      default: false,
    },
    images: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      default: '',
    },
    specifications: {
      type: Map,
      of: String,
      default: {},
    },
    seller: {
      name: { type: String, default: 'Zaraz Mall Official Store' },
      rating: { type: Number, default: 4.9 },
      responseRate: { type: String, default: '98%' },
    },
    deliveryInfo: {
      standardDays: { type: String, default: '2 - 3 Days' },
      standardFee: { type: Number, default: 60 },
      expressDays: { type: String, default: 'Within 24 Hours' },
      expressFee: { type: Number, default: 120 },
      codAvailable: { type: Boolean, default: true },
    },
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

// Indexes for fast searching and filtering
productSchema.index({ title: 'text', brand: 'text', category: 'text' });
productSchema.index({ categorySlug: 1 });
productSchema.index({ isFlashSale: 1 });
productSchema.index({ price: 1 });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
