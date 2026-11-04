import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    icon: {
      type: String,
      default: 'Sparkles',
    },
    image: {
      type: String,
      default: '',
    },
    itemCount: {
      type: Number,
      default: 0,
    },
    accentColor: {
      type: String,
      default: '#10b981',
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

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
export default Category;
