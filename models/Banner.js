import mongoose from 'mongoose';

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

const Banner = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);
export default Banner;
