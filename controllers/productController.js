import Product from '../models/Product.js';

export const getAllProducts = async (req, res) => {
  try {
    const { category, search, flashSale, sort, brand, minPrice, maxPrice, limit = 50, page = 1 } = req.query;

    const query = {};

    if (category && category !== 'all') {
      query.categorySlug = category.toLowerCase();
    }

    if (flashSale === 'true') {
      query.isFlashSale = true;
    }

    if (brand) {
      query.brand = new RegExp(brand, 'i');
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { description: searchRegex },
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'price-asc') sortOptions = { price: 1 };
    else if (sort === 'price-desc') sortOptions = { price: -1 };
    else if (sort === 'rating') sortOptions = { rating: -1 };
    else if (sort === 'sold') sortOptions = { soldCount: -1 };

    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    const skip = (parsedPage - 1) * parsedLimit;

    const totalCount = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parsedLimit);

    res.status(200).json({
      success: true,
      count: products.length,
      totalCount,
      currentPage: parsedPage,
      totalPages: Math.ceil(totalCount / parsedLimit),
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    let product;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id);
    }

    if (!product) {
      product = await Product.findOne({ slug: id.toLowerCase() });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with id or slug: ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving product',
      error: error.message,
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const body = req.body;
    const slug =
      body.slug ||
      body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const newProduct = await Product.create({
      ...body,
      slug,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully in Zaraz Catalog',
      product: newProduct,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create product',
      error: error.message,
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Product not found for update',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updated,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update product',
      error: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Product not found for deletion',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product removed successfully from inventory',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message,
    });
  }
};
