import { query as sqlQuery, execute as sqlExecute } from '../../config/mysqlDb.js';
import { generateId, formatSqlDate } from './helpers.js';

export const formatCategoryRow = (row) => {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    icon: row.icon || 'Sparkles',
    image: row.image || '',
    itemCount: Number(row.itemCount || 0),
    accentColor: row.accentColor || '#10b981',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

class MysqlCategoryQuery {
  constructor(whereClause, params) {
    this._where = whereClause;
    this._params = params;
    this._sort = 'name ASC';
  }

  sort(sortOptions) {
    if (typeof sortOptions === 'string') {
      this._sort = sortOptions;
    } else if (sortOptions && typeof sortOptions === 'object') {
      const entries = Object.entries(sortOptions);
      if (entries.length > 0) {
        const [field, dir] = entries[0];
        const direction = dir === 1 || dir === 'asc' ? 'ASC' : 'DESC';
        const safeField = ['name', 'itemCount', 'createdAt'].includes(field) ? field : 'name';
        this._sort = `${safeField} ${direction}`;
      }
    }
    return this;
  }

  async exec() {
    const sql = `SELECT * FROM categories ${this._where} ORDER BY ${this._sort}`;
    const rows = await sqlQuery(sql, this._params);
    return rows.map(formatCategoryRow);
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

export const MysqlCategory = {
  find(filter = {}) {
    const conditions = [];
    const params = [];
    if (filter.slug) {
      conditions.push('slug = ?');
      params.push(String(filter.slug).toLowerCase());
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return new MysqlCategoryQuery(whereClause, params);
  },

  async findOne(filter = {}) {
    const conditions = [];
    const params = [];
    if (filter.slug) {
      conditions.push('slug = ?');
      params.push(String(filter.slug).toLowerCase());
    }
    if (filter.id || filter._id) {
      conditions.push('id = ?');
      params.push(String(filter.id || filter._id));
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM categories ${whereClause} LIMIT 1`;
    const rows = await sqlQuery(sql, params);
    return rows.length > 0 ? formatCategoryRow(rows[0]) : null;
  },

  async findById(id) {
    return this.findOne({ id });
  },

  async countDocuments(filter = {}) {
    const sql = `SELECT COUNT(*) as count FROM categories`;
    const rows = await sqlQuery(sql);
    return Number(rows[0]?.count || 0);
  },

  async create(data) {
    const id = data.id || data._id || generateId();
    const slug = data.slug || String(data.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const now = formatSqlDate(new Date());

    const sql = `
      INSERT INTO categories (id, name, slug, icon, image, itemCount, accentColor, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await sqlExecute(sql, [
      id,
      data.name,
      slug,
      data.icon || 'Sparkles',
      data.image || '',
      Number(data.itemCount || 0),
      data.accentColor || '#10b981',
      now,
      now,
    ]);

    return this.findById(id);
  },
};

export default MysqlCategory;
