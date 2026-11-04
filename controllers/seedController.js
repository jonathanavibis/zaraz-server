import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Banner from '../models/Banner.js';
import User from '../models/User.js';
import { seedProducts, seedCategories, seedBanners } from '../data/seedData.js';

export const seedDatabase = async (req, res) => {
  try {
    // Delete existing
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Banner.deleteMany({});

    // Insert seeds
    const createdCategories = await Category.insertMany(seedCategories);
    const createdBanners = await Banner.insertMany(seedBanners);
    const createdProducts = await Product.insertMany(seedProducts);

    // Create demo user if not exists
    let demoUser = await User.findOne({ email: 'user@zaraz.com' });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Demo Customer',
        email: 'user@zaraz.com',
        password: 'password123',
        phone: '01712345678',
        address: 'House 12, Road 4, Sector 7, Uttara, Dhaka',
        role: 'customer',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Zaraz MongoDB Atlas database seeded successfully!',
      stats: {
        categories: createdCategories.length,
        banners: createdBanners.length,
        products: createdProducts.length,
        demoUser: demoUser.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to seed database',
      error: error.message,
    });
  }
};
