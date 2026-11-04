import Category from '../models/Category.js';

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
};

export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug: slug.toLowerCase() });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message,
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, icon, image, itemCount, accentColor } = req.body;
    const slug = req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const category = await Category.create({
      name,
      slug,
      icon,
      image,
      itemCount: itemCount || 0,
      accentColor: accentColor || '#10b981',
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create category',
      error: error.message,
    });
  }
};
