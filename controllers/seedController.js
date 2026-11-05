import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Banner from '../models/Banner.js';
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

    res.status(200).json({
      success: true,
      message: 'Zaraz MongoDB Atlas catalog seeded successfully without demo accounts!',
      databases: {
        catalogDb: 'zaraz_db',
        authDb: 'zaraz_auth_db (User accounts managed via real Sign-Up & OAuth)',
      },
      stats: {
        categories: createdCategories.length,
        banners: createdBanners.length,
        products: createdProducts.length,
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
