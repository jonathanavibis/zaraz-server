import bcrypt from 'bcryptjs';
import { query as sqlQuery, execute as sqlExecute } from '../../config/mysqlDb.js';
import { generateId, formatSqlDate } from './helpers.js';

export const formatUserRow = (row) => {
  if (!row) return null;
  const user = {
    _id: String(row.id),
    id: String(row.id),
    name: String(row.name),
    email: String(row.email).toLowerCase(),
    password: row.password,
    image: row.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    phone: row.phone || '',
    address: row.address || '',
    role: row.role || 'customer',
    provider: row.provider || 'credentials',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };

  // Attach matchPassword method
  user.matchPassword = async function (enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
  };

  // Attach save method
  user.save = async function () {
    const now = formatSqlDate(new Date());
    const sql = `
      UPDATE users SET name = ?, phone = ?, address = ?, image = ?, role = ?, updatedAt = ?
      WHERE id = ?
    `;
    await sqlExecute(sql, [
      this.name,
      this.phone || '',
      this.address || '',
      this.image || '',
      this.role || 'customer',
      now,
      this.id,
    ]);
    return this;
  };

  return user;
};

class MysqlUserQuery {
  constructor(whereClause, params) {
    this._where = whereClause;
    this._params = params;
    this._sort = 'createdAt DESC';
    this._limit = null;
  }

  sort(sortOptions) {
    if (typeof sortOptions === 'string') {
      this._sort = sortOptions;
    } else if (sortOptions && typeof sortOptions === 'object') {
      const [field, dir] = Object.entries(sortOptions)[0] || ['createdAt', -1];
      const direction = dir === 1 || dir === 'asc' ? 'ASC' : 'DESC';
      this._sort = `${field} ${direction}`;
    }
    return this;
  }

  limit(n) {
    this._limit = Math.max(1, parseInt(n, 10) || 50);
    return this;
  }

  async exec() {
    let sql = `SELECT * FROM users ${this._where} ORDER BY ${this._sort}`;
    if (this._limit) {
      sql += ` LIMIT ${this._limit}`;
    }
    const rows = await sqlQuery(sql, this._params);
    return rows.map(formatUserRow);
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

export const MysqlUser = {
  find(filter = {}) {
    const conditions = [];
    const params = [];

    if (filter.role) {
      if (filter.role.$in && Array.isArray(filter.role.$in)) {
        conditions.push(`role IN (${filter.role.$in.map(() => '?').join(', ')})`);
        params.push(...filter.role.$in);
      } else {
        conditions.push('role = ?');
        params.push(filter.role);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return new MysqlUserQuery(whereClause, params);
  },

  async findOne(filter = {}) {
    const conditions = [];
    const params = [];

    if (filter.email) {
      conditions.push('LOWER(email) = ?');
      params.push(String(filter.email).toLowerCase().trim());
    }
    if (filter.id || filter._id) {
      conditions.push('id = ?');
      params.push(String(filter.id || filter._id));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM users ${whereClause} LIMIT 1`;
    const rows = await sqlQuery(sql, params);
    return rows.length > 0 ? formatUserRow(rows[0]) : null;
  },

  async findById(id) {
    if (!id) return null;
    const sql = `SELECT * FROM users WHERE id = ? LIMIT 1`;
    const rows = await sqlQuery(sql, [String(id)]);
    return rows.length > 0 ? formatUserRow(rows[0]) : null;
  },

  async countDocuments(filter = {}) {
    const conditions = [];
    const params = [];

    if (filter.role) {
      if (filter.role.$in && Array.isArray(filter.role.$in)) {
        conditions.push(`role IN (${filter.role.$in.map(() => '?').join(', ')})`);
        params.push(...filter.role.$in);
      } else {
        conditions.push('role = ?');
        params.push(filter.role);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) as count FROM users ${whereClause}`;
    const rows = await sqlQuery(sql, params);
    return Number(rows[0]?.count || 0);
  },

  async create(data) {
    const id = data.id || data._id || generateId();
    const email = String(data.email || '').toLowerCase().trim();
    let passwordHash = data.password || '';

    // If password is not yet hashed with bcrypt ($2a$ or $2b$), hash it
    if (passwordHash && !passwordHash.startsWith('$2')) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(passwordHash, salt);
    }

    const now = formatSqlDate(new Date());

    const sql = `
      INSERT INTO users (id, name, email, password, image, phone, address, role, provider, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await sqlExecute(sql, [
      id,
      data.name || 'Zaraz Member',
      email,
      passwordHash,
      data.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      data.phone || '',
      data.address || '',
      data.role || 'customer',
      data.provider || 'credentials',
      now,
      now,
    ]);

    return this.findById(id);
  },

  async findByIdAndDelete(id) {
    const user = await this.findById(id);
    if (!user) return null;
    await sqlExecute('DELETE FROM users WHERE id = ?', [String(id)]);
    return user;
  },
};

export default MysqlUser;
