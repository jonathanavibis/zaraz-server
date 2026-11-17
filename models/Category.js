import mongoose from 'mongoose';
import MysqlCategory from './mysql/categoryModel.js';
import { isMysqlMode } from '../config/dbMode.js';

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

const MongooseCategory = mongoose.models.Category || mongoose.model('Category', categorySchema);

const Category = new Proxy(function () {}, {
  get(target, prop) {
    if (isMysqlMode() && MysqlCategory[prop]) {
      return MysqlCategory[prop];
    }
    const val = MongooseCategory[prop];
    return typeof val === 'function' ? val.bind(MongooseCategory) : val;
  },
  construct(target, args) {
    if (isMysqlMode()) {
      return MysqlCategory.create(...args);
    }
    return new MongooseCategory(...args);
  },
  apply(target, thisArg, args) {
    if (isMysqlMode()) {
      return MysqlCategory.create(...args);
    }
    return MongooseCategory.apply(thisArg, args);
  },
});

export default Category;
