import mongoose from 'mongoose';
import MysqlBanner from './mysql/bannerModel.js';
import { isMysqlMode } from '../config/dbMode.js';

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    highlightText: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      required: true,
    },
    buttonText: {
      type: String,
      default: 'Shop Now',
    },
    link: {
      type: String,
      default: '/#products',
    },
    badge: {
      type: String,
      default: 'MEGA DEAL',
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

const MongooseBanner = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);

const Banner = new Proxy(function () {}, {
  get(target, prop) {
    if (isMysqlMode() && MysqlBanner[prop]) {
      return MysqlBanner[prop];
    }
    const val = MongooseBanner[prop];
    return typeof val === 'function' ? val.bind(MongooseBanner) : val;
  },
  construct(target, args) {
    if (isMysqlMode()) {
      return MysqlBanner.create(...args);
    }
    return new MongooseBanner(...args);
  },
  apply(target, thisArg, args) {
    if (isMysqlMode()) {
      return MysqlBanner.create(...args);
    }
    return MongooseBanner.apply(thisArg, args);
  },
});

export default Banner;
