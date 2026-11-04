import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Banner from '../models/Banner.js';
import User from '../models/User.js';
import { seedProducts, seedCategories, seedBanners } from '../data/seedData.js';

export const seedDatabase = async (req, res) => {
  try {
    // Delete existing catalog items in zaraz_db
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Banner.deleteMany({});

    // Insert seeds into zaraz_db
    const createdCategories = await Category.insertMany(seedCategories);
    const createdBanners = await Banner.insertMany(seedBanners);
    const createdProducts = await Product.insertMany(seedProducts);

    // Create demo accounts in zaraz_auth_db if they do not exist
    const demoAccounts = [
      {
        name: 'Demo Customer',
        email: 'user@zaraz.com',
        password: 'Password123',
        phone: '01712345678',
        address: 'House 12, Road 4, Sector 7, Uttara, Dhaka',
        role: 'customer',
      },
      {
        name: 'Zaraz Admin',
        email: 'admin@zaraz.com',
        password: 'AdminPassword123',
        phone: '01899887766',
        address: 'Zaraz Headquarters, Gulshan 2, Dhaka',
        role: 'admin',
      },
      {
        name: 'Official Mall Seller',
        email: 'seller@zaraz.com',
        password: 'SellerPassword123',
        phone: '01911223344',
        address: 'Tejgaon Industrial Area, Dhaka',
        role: 'seller',
      },
    ];

    for (const acc of demoAccounts) {
      const exists = await User.findOne({ email: acc.email });
      if (!exists) {
        await User.create(acc);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Zaraz MongoDB Atlas database seeded successfully!',
      databases: {
        catalogDb: 'zaraz_db',
        authDb: 'zaraz_auth_db',
      },
      stats: {
        categories: createdCategories.length,
        banners: createdBanners.length,
        products: createdProducts.length,
        demoAccounts: demoAccounts.map((a) => a.email),
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
