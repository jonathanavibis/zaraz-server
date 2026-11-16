import { query as sqlQuery, execute as sqlExecute } from '../../config/mysqlDb.js';
import { generateId, safeJsonParse, safeJsonStringify, formatSqlDate } from './helpers.js';

export const formatProductRow = (row) => {
  if (!row) return null;
  const p = { ...row };
  p._id = String(row.id);
  p.id = String(row.id);
  p.price = Number(row.price);
  p.originalPrice = Number(row.originalPrice || row.price);
  p.discountPercentage = Number(row.discountPercentage || 0);
  p.rating = Number(row.rating || 4.8);
  p.reviewsCount = Number(row.reviewsCount || 0);
  p.stock = Number(row.stock !== undefined ? row.stock : 10);
  p.soldCount = Number(row.soldCount || 0);
  p.isFlashSale = Boolean(row.isFlashSale);
  p.isFreeDelivery = Boolean(row.isFreeDelivery);
  p.isOfficial = Boolean(row.isOfficial);

  p.images = safeJsonParse(row.images, []);
  p.specifications = safeJsonParse(row.specifications, {});
  p.seller = safeJsonParse(row.seller, {
    name: 'Zaraz Mall Official Store',
    rating: 4.9,
    responseRate: '98%',
  });
  p.deliveryInfo = safeJsonParse(row.deliveryInfo, {
    standardDays: '2 - 3 Days',
    standardFee: 60,
    expressDays: 'Within 24 Hours',
    expressFee: 120,
    codAvailable: true,
  });

  return p;
};

const buildWhereClause = (filter = {}) => {
  const conditions = [];
  const params = [];

  if (filter.categorySlug) {
    conditions.push('categorySlug = ?');
    params.push(String(filter.categorySlug).toLowerCase());
  }

  if (filter.isFlashSale !== undefined) {
    conditions.push('isFlashSale = ?');
    params.push(filter.isFlashSale ? 1 : 0);
  }

  if (filter.brand) {
    let brandStr = filter.brand;
    if (filter.brand instanceof RegExp) {
      brandStr = filter.brand.source;
    }
    conditions.push('brand LIKE ?');
    params.push(`%${brandStr}%`);
  }

  if (filter.price) {
    if (filter.price.$gte !== undefined) {
      conditions.push('price >= ?');
      params.push(Number(filter.price.$gte));
    }
    if (filter.price.$lte !== undefined) {
      conditions.push('price <= ?');
      params.push(Number(filter.price.$lte));
    }
  }

  if (filter.$or && Array.isArray(filter.$or)) {
    const orParts = [];
    for (const term of filter.$or) {
      const field = Object.keys(term)[0];
      const val = term[field];
      const searchStr = val instanceof RegExp ? val.source : String(val);
      if (['title', 'brand', 'category', 'description'].includes(field)) {
        orParts.push(`${field} LIKE ?`);
        params.push(`%${searchStr}%`);
      }
    }
    if (orParts.length > 0) {
      conditions.push(`(${orParts.join(' OR ')})`);
    }
  }

  if (filter.slug) {
    conditions.push('slug = ?');
    params.push(String(filter.slug).toLowerCase());
  }

  if (filter._id || filter.id) {
    conditions.push('id = ?');
    params.push(String(filter._id || filter.id));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
};

class MysqlProductQuery {
  constructor(whereClause, params) {
    this._where = whereClause;
    this._params = params;
    this._sort = 'createdAt DESC';
    this._skip = 0;
    this._limit = 50;
  }

  sort(sortOptions) {
    if (typeof sortOptions === 'string') {
      this._sort = sortOptions;
    } else if (sortOptions && typeof sortOptions === 'object') {
      const entries = Object.entries(sortOptions);
      if (entries.length > 0) {
        const [field, dir] = entries[0];
        const direction = dir === 1 || dir === 'asc' || dir === 'ASC' ? 'ASC' : 'DESC';
        const safeField = ['price', 'rating', 'soldCount', 'createdAt', 'title'].includes(field)
          ? field
          : 'createdAt';
        this._sort = `${safeField} ${direction}`;
      }
    }
    return this;
  }

  skip(n) {
    this._skip = Math.max(0, parseInt(n, 10) || 0);
    return this;
  }

  limit(n) {
    this._limit = Math.max(1, parseInt(n, 10) || 50);
    return this;
  }

  async exec() {
    const sql = `SELECT * FROM products ${this._where} ORDER BY ${this._sort} LIMIT ${this._limit} OFFSET ${this._skip}`;
    const rows = await sqlQuery(sql, this._params);
    return rows.map(formatProductRow);
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

export const MysqlProduct = {
  find(filter = {}) {
    const { whereClause, params } = buildWhereClause(filter);
    return new MysqlProductQuery(whereClause, params);
  },

  async findOne(filter = {}) {
    const { whereClause, params } = buildWhereClause(filter);
    const sql = `SELECT * FROM products ${whereClause} LIMIT 1`;
    const rows = await sqlQuery(sql, params);
    return rows.length > 0 ? formatProductRow(rows[0]) : null;
  },

  async findById(id) {
    if (!id) return null;
    const sql = `SELECT * FROM products WHERE id = ? LIMIT 1`;
    const rows = await sqlQuery(sql, [String(id)]);
    return rows.length > 0 ? formatProductRow(rows[0]) : null;
  },

  async countDocuments(filter = {}) {
    const { whereClause, params } = buildWhereClause(filter);
    const sql = `SELECT COUNT(*) as count FROM products ${whereClause}`;
    const rows = await sqlQuery(sql, params);
    return Number(rows[0]?.count || 0);
  },

  async create(data) {
    const id = data.id || data._id || generateId();
    const slug = data.slug || String(data.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const price = Number(data.price || 0);
    const originalPrice = Number(data.originalPrice || price);
    const discountPercentage = Number(data.discountPercentage || 0);
    const rating = Number(data.rating || 4.8);
    const reviewsCount = Number(data.reviewsCount || 0);
    const stock = Number(data.stock !== undefined ? data.stock : 10);
    const soldCount = Number(data.soldCount || 0);
    const category = data.category || 'General';
    const categorySlug = data.categorySlug || category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const brand = data.brand || 'Zaraz';
    const isFlashSale = data.isFlashSale ? 1 : 0;
    const isFreeDelivery = data.isFreeDelivery ? 1 : 0;
    const isOfficial = data.isOfficial !== undefined ? (data.isOfficial ? 1 : 0) : 1;
    const images = safeJsonStringify(data.images || [], '[]');
    const description = data.description || '';
    const specifications = safeJsonStringify(data.specifications || {}, '{}');
    const seller = safeJsonStringify(data.seller || { name: 'Zaraz Mall Official Store', rating: 4.9, responseRate: '98%' }, '{}');
    const deliveryInfo = safeJsonStringify(data.deliveryInfo || { standardDays: '2 - 3 Days', standardFee: 60, expressDays: 'Within 24 Hours', expressFee: 120, codAvailable: true }, '{}');
    const now = formatSqlDate(new Date());

    const sql = `
      INSERT INTO products (
        id, title, slug, price, originalPrice, discountPercentage, rating, reviewsCount,
        stock, soldCount, category, categorySlug, brand, isFlashSale, isFreeDelivery,
        isOfficial, images, description, specifications, seller, deliveryInfo, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await sqlExecute(sql, [
      id,
      data.title || 'Untitled Product',
      slug,
      price,
      originalPrice,
      discountPercentage,
      rating,
      reviewsCount,
      stock,
      soldCount,
      category,
      categorySlug,
      brand,
      isFlashSale,
      isFreeDelivery,
      isOfficial,
      images,
      description,
      specifications,
      seller,
      deliveryInfo,
      now,
      now,
    ]);

    return this.findById(id);
  },

  async findByIdAndUpdate(id, updateData, options = {}) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const fields = [];
    const params = [];

    const allowedFields = [
      'title', 'slug', 'price', 'originalPrice', 'discountPercentage',
      'rating', 'reviewsCount', 'stock', 'soldCount', 'category', 'categorySlug',
      'brand', 'isFlashSale', 'isFreeDelivery', 'isOfficial', 'description'
    ];

    for (const f of allowedFields) {
      if (updateData[f] !== undefined) {
        fields.push(`${f} = ?`);
        if (['isFlashSale', 'isFreeDelivery', 'isOfficial'].includes(f)) {
          params.push(updateData[f] ? 1 : 0);
        } else {
          params.push(updateData[f]);
        }
      }
    }

    if (updateData.images !== undefined) {
      fields.push('images = ?');
      params.push(safeJsonStringify(updateData.images, '[]'));
    }
    if (updateData.specifications !== undefined) {
      fields.push('specifications = ?');
      params.push(safeJsonStringify(updateData.specifications, '{}'));
    }
    if (updateData.seller !== undefined) {
      fields.push('seller = ?');
      params.push(safeJsonStringify(updateData.seller, '{}'));
    }
    if (updateData.deliveryInfo !== undefined) {
      fields.push('deliveryInfo = ?');
      params.push(safeJsonStringify(updateData.deliveryInfo, '{}'));
    }

    if (fields.length > 0) {
      fields.push('updatedAt = ?');
      params.push(formatSqlDate(new Date()));
      params.push(String(id));

      const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
      await sqlExecute(sql, params);
    }

    return this.findById(id);
  },

  async findByIdAndDelete(id) {
    const existing = await this.findById(id);
    if (!existing) return null;
    await sqlExecute(`DELETE FROM products WHERE id = ?`, [String(id)]);
    return existing;
  },
};

export default MysqlProduct;
