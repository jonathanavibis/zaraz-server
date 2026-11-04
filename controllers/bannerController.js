import Banner from '../models/Banner.js';

export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: banners.length,
      banners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banners',
      error: error.message,
    });
  }
};

export const createBanner = async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Banner added successfully',
      banner,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create banner',
      error: error.message,
    });
  }
};
