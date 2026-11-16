import { query as sqlQuery, execute as sqlExecute } from '../../config/mysqlDb.js';
import { generateId, formatSqlDate } from './helpers.js';

export const formatBannerRow = (row) => {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: String(row.id),
    title: String(row.title),
    subtitle: row.subtitle || '',
    highlightText: row.highlightText || '',
    image: String(row.image),
    buttonText: row.buttonText || 'Shop Now',
    link: row.link || '/#products',
    badge: row.badge || 'MEGA DEAL',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

class MysqlBannerQuery {
  constructor() {
    this._sort = 'createdAt DESC';
  }

  sort(sortOptions) {
    if (typeof sortOptions === 'string') {
      this._sort = sortOptions;
    } else if (sortOptions && typeof sortOptions === 'object') {
      const entries = Object.entries(sortOptions);
      if (entries.length > 0) {
        const [field, dir] = entries[0];
        const direction = dir === 1 || dir === 'asc' ? 'ASC' : 'DESC';
        this._sort = `${field} ${direction}`;
      }
    }
    return this;
  }

  async exec() {
    const sql = `SELECT * FROM banners ORDER BY ${this._sort}`;
    const rows = await sqlQuery(sql);
    return rows.map(formatBannerRow);
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

export const MysqlBanner = {
  find() {
    return new MysqlBannerQuery();
  },

  async findById(id) {
    const rows = await sqlQuery('SELECT * FROM banners WHERE id = ? LIMIT 1', [String(id)]);
    return rows.length > 0 ? formatBannerRow(rows[0]) : null;
  },

  async countDocuments() {
    const rows = await sqlQuery('SELECT COUNT(*) as count FROM banners');
    return Number(rows[0]?.count || 0);
  },

  async create(data) {
    const id = data.id || data._id || generateId();
    const now = formatSqlDate(new Date());

    const sql = `
      INSERT INTO banners (id, title, subtitle, highlightText, image, buttonText, link, badge, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await sqlExecute(sql, [
      id,
      data.title || 'Special Promotion',
      data.subtitle || '',
      data.highlightText || '',
      data.image || '',
      data.buttonText || 'Shop Now',
      data.link || '/#products',
      data.badge || 'MEGA DEAL',
      now,
      now,
    ]);

    return this.findById(id);
  },
};

export default MysqlBanner;
