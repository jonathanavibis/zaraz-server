import { query as sqlQuery, execute as sqlExecute } from '../../config/mysqlDb.js';
import { generateId, safeJsonParse, safeJsonStringify, formatSqlDate } from './helpers.js';

export const formatOrderRow = (row) => {
  if (!row) return null;
  const order = {
    _id: String(row.id),
    id: String(row.id),
    orderNumber: String(row.orderNumber),
    userId: row.userId ? String(row.userId) : null,
    customer: safeJsonParse(row.customer, {}),
    items: safeJsonParse(row.items, []),
    delivery: safeJsonParse(row.delivery, { method: 'standard', fee: 60, estimatedDelivery: '2 - 3 Days' }),
    payment: safeJsonParse(row.payment, { method: 'cod', status: 'Pending' }),
    pricing: safeJsonParse(row.pricing, { subtotal: 0, shippingFee: 60, discount: 0, total: 60 }),
    status: row.status || 'Order Placed',
    timeline: safeJsonParse(row.timeline, []),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };

  // Attach save method
  order.save = async function () {
    const now = formatSqlDate(new Date());
    const sql = `
      UPDATE orders
      SET status = ?, customer = ?, items = ?, delivery = ?, payment = ?, pricing = ?, timeline = ?, updatedAt = ?
      WHERE id = ?
    `;
    await sqlExecute(sql, [
      this.status,
      safeJsonStringify(this.customer, '{}'),
      safeJsonStringify(this.items, '[]'),
      safeJsonStringify(this.delivery, '{}'),
      safeJsonStringify(this.payment, '{}'),
      safeJsonStringify(this.pricing, '{}'),
      safeJsonStringify(this.timeline, '[]'),
      now,
      this.id,
    ]);
    return this;
  };

  return order;
};

class MysqlOrderQuery {
  constructor(whereClause, params) {
    this._where = whereClause;
    this._params = params;
    this._sort = 'createdAt DESC';
    this._limit = null;
    this._skip = 0;
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

  skip(n) {
    this._skip = Math.max(0, parseInt(n, 10) || 0);
    return this;
  }

  limit(n) {
    this._limit = Math.max(1, parseInt(n, 10) || 50);
    return this;
  }

  async exec() {
    let sql = `SELECT * FROM orders ${this._where} ORDER BY ${this._sort}`;
    if (this._limit) {
      sql += ` LIMIT ${this._limit} OFFSET ${this._skip}`;
    }
    const rows = await sqlQuery(sql, this._params);
    return rows.map(formatOrderRow);
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

export const MysqlOrder = {
  find(filter = {}) {
    const conditions = [];
    const params = [];

    if (filter.userId) {
      conditions.push('userId = ?');
      params.push(String(filter.userId));
    }
    if (filter.status) {
      conditions.push('status = ?');
      params.push(filter.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return new MysqlOrderQuery(whereClause, params);
  },

  async findOne(filter = {}) {
    const conditions = [];
    const params = [];

    if (filter.orderNumber) {
      conditions.push('orderNumber = ?');
      params.push(String(filter.orderNumber));
    }
    if (filter.id || filter._id) {
      conditions.push('id = ?');
      params.push(String(filter.id || filter._id));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM orders ${whereClause} LIMIT 1`;
    const rows = await sqlQuery(sql, params);
    return rows.length > 0 ? formatOrderRow(rows[0]) : null;
  },

  async findById(id) {
    if (!id) return null;
    const sql = `SELECT * FROM orders WHERE id = ? LIMIT 1`;
    const rows = await sqlQuery(sql, [String(id)]);
    return rows.length > 0 ? formatOrderRow(rows[0]) : null;
  },

  async countDocuments(filter = {}) {
    const conditions = [];
    const params = [];
    if (filter.status) {
      conditions.push('status = ?');
      params.push(filter.status);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) as count FROM orders ${whereClause}`;
    const rows = await sqlQuery(sql, params);
    return Number(rows[0]?.count || 0);
  },

  async create(data) {
    const id = data.id || data._id || generateId();
    const orderNumber = data.orderNumber || `ZRZ-${Math.floor(100000 + Math.random() * 900000)}`;
    const userId = data.userId ? String(data.userId) : null;
    const customer = safeJsonStringify(data.customer || {}, '{}');
    const items = safeJsonStringify(data.items || [], '[]');
    const delivery = safeJsonStringify(data.delivery || {}, '{}');
    const payment = safeJsonStringify(data.payment || {}, '{}');
    const pricing = safeJsonStringify(data.pricing || {}, '{}');
    const status = data.status || 'Order Placed';
    const timeline = safeJsonStringify(data.timeline || [], '[]');
    const now = formatSqlDate(new Date());

    const sql = `
      INSERT INTO orders (id, orderNumber, userId, customer, items, delivery, payment, pricing, status, timeline, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await sqlExecute(sql, [
      id,
      orderNumber,
      userId,
      customer,
      items,
      delivery,
      payment,
      pricing,
      status,
      timeline,
      now,
      now,
    ]);

    return this.findById(id);
  },
};

export default MysqlOrder;
