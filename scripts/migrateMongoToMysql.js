import mysql from 'mysql2/promise';
import mongoose from 'mongoose';

const MONGO_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://zaraz-admin:6681CptbyrN76kua@cluster0.qlpxs02.mongodb.net/zaraz_db?retryWrites=true&w=majority';

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'zaraz_db',
  waitForConnections: true,
  connectionLimit: 10,
};

const formatSqlDate = (d) => {
  if (!d) return null;
  const dateObj = d instanceof Date ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return null;
  return dateObj.toISOString().slice(0, 19).replace('T', ' ');
};

async function runMigration() {
  console.log('🚀 Starting MongoDB Atlas -> XAMPP MySQL Migration...');

  // 1. Connect to MySQL
  const mysqlConn = await mysql.createConnection(MYSQL_CONFIG);
  console.log(`✅ Connected to XAMPP MySQL (${MYSQL_CONFIG.database}) at ${MYSQL_CONFIG.host}:${MYSQL_CONFIG.port}`);

  // 2. Create Schema
  console.log('🛠️ Creating MySQL tables...');

  await mysqlConn.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      icon VARCHAR(100) DEFAULT 'Sparkles',
      image TEXT,
      itemCount INT DEFAULT 0,
      accentColor VARCHAR(50) DEFAULT '#10b981',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_category_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await mysqlConn.query(`
    CREATE TABLE IF NOT EXISTS banners (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      subtitle TEXT,
      highlightText VARCHAR(255),
      image TEXT NOT NULL,
      buttonText VARCHAR(100) DEFAULT 'Shop Now',
      link VARCHAR(255) DEFAULT '/#products',
      badge VARCHAR(100) DEFAULT 'MEGA DEAL',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await mysqlConn.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      originalPrice DECIMAL(12,2) DEFAULT 0.00,
      discountPercentage INT DEFAULT 0,
      rating DECIMAL(3,2) DEFAULT 4.80,
      reviewsCount INT DEFAULT 0,
      stock INT DEFAULT 10,
      soldCount INT DEFAULT 0,
      category VARCHAR(255) NOT NULL,
      categorySlug VARCHAR(255) NOT NULL,
      brand VARCHAR(255) NOT NULL,
      isFlashSale TINYINT(1) DEFAULT 0,
      isFreeDelivery TINYINT(1) DEFAULT 0,
      isOfficial TINYINT(1) DEFAULT 0,
      images JSON,
      description LONGTEXT,
      specifications JSON,
      seller JSON,
      deliveryInfo JSON,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_product_slug (slug),
      INDEX idx_product_cat (categorySlug),
      INDEX idx_product_flash (isFlashSale),
      INDEX idx_product_brand (brand)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await mysqlConn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255),
      image TEXT,
      phone VARCHAR(50),
      address TEXT,
      role VARCHAR(50) DEFAULT 'customer',
      provider VARCHAR(50) DEFAULT 'credentials',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await mysqlConn.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(64) PRIMARY KEY,
      orderNumber VARCHAR(64) NOT NULL UNIQUE,
      userId VARCHAR(64),
      customer JSON NOT NULL,
      items JSON NOT NULL,
      delivery JSON,
      payment JSON,
      pricing JSON NOT NULL,
      status VARCHAR(50) DEFAULT 'Order Placed',
      timeline JSON,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_order_number (orderNumber),
      INDEX idx_order_user (userId),
      INDEX idx_order_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await mysqlConn.query(`
    CREATE TABLE IF NOT EXISTS server_accounts (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255),
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'ADMIN',
      type VARCHAR(50) DEFAULT 'ADMIN',
      isActive TINYINT(1) DEFAULT 1,
      lastLoginAt DATETIME,
      lastLoginIp VARCHAR(100),
      loginCount INT DEFAULT 0,
      successLogins INT DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_server_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await mysqlConn.query(`
    CREATE TABLE IF NOT EXISTS server_login_logs (
      id VARCHAR(64) PRIMARY KEY,
      accountId VARCHAR(100),
      name VARCHAR(255),
      type VARCHAR(50) DEFAULT 'VIEWER',
      role VARCHAR(50) DEFAULT 'VIEWER',
      ip VARCHAR(100),
      userAgent TEXT,
      status VARCHAR(50),
      message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_log_account (accountId),
      INDEX idx_log_timestamp (timestamp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('✅ Tables created/verified in MySQL!');

  // 3. Connect to MongoDB Atlas
  console.log('🔗 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
  });
  console.log('✅ Connected to MongoDB Atlas!');

  const storeDb = mongoose.connection.db;
  const authDb = mongoose.connection.useDb('zaraz_auth_db').db;
  const serverAccDb = mongoose.connection.useDb('SERVER_ACC').db;

  // 4. Migrate Categories
  const categories = await storeDb.collection('categories').find({}).toArray();
  console.log(`📦 Migrating ${categories.length} categories...`);
  for (const cat of categories) {
    const id = cat._id.toString();
    await mysqlConn.query(
      `REPLACE INTO categories (id, name, slug, icon, image, itemCount, accentColor, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        cat.name || '',
        cat.slug || '',
        cat.icon || 'Sparkles',
        cat.image || '',
        cat.itemCount || 0,
        cat.accentColor || '#10b981',
        formatSqlDate(cat.createdAt) || formatSqlDate(new Date()),
        formatSqlDate(cat.updatedAt) || formatSqlDate(new Date()),
      ]
    );
  }

  // 5. Migrate Banners
  const banners = await storeDb.collection('banners').find({}).toArray();
  console.log(`📦 Migrating ${banners.length} banners...`);
  for (const b of banners) {
    const id = b._id.toString();
    await mysqlConn.query(
      `REPLACE INTO banners (id, title, subtitle, highlightText, image, buttonText, link, badge, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        b.title || '',
        b.subtitle || '',
        b.highlightText || '',
        b.image || '',
        b.buttonText || 'Shop Now',
        b.link || '/#products',
        b.badge || 'MEGA DEAL',
        formatSqlDate(b.createdAt) || formatSqlDate(new Date()),
        formatSqlDate(b.updatedAt) || formatSqlDate(new Date()),
      ]
    );
  }

  // 6. Migrate Products
  const products = await storeDb.collection('products').find({}).toArray();
  console.log(`📦 Migrating ${products.length} products...`);
  for (const p of products) {
    const id = p._id.toString();
    await mysqlConn.query(
      `REPLACE INTO products (
        id, title, slug, price, originalPrice, discountPercentage, rating, reviewsCount,
        stock, soldCount, category, categorySlug, brand, isFlashSale, isFreeDelivery,
        isOfficial, images, description, specifications, seller, deliveryInfo, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        p.title || '',
        p.slug || '',
        p.price || 0,
        p.originalPrice || p.price || 0,
        p.discountPercentage || 0,
        p.rating || 4.8,
        p.reviewsCount || 0,
        p.stock !== undefined ? p.stock : 10,
        p.soldCount || 0,
        p.category || '',
        p.categorySlug || '',
        p.brand || '',
        p.isFlashSale ? 1 : 0,
        p.isFreeDelivery ? 1 : 0,
        p.isOfficial ? 1 : 0,
        JSON.stringify(p.images || []),
        p.description || '',
        JSON.stringify(p.specifications || {}),
        JSON.stringify(p.seller || {}),
        JSON.stringify(p.deliveryInfo || {}),
        formatSqlDate(p.createdAt) || formatSqlDate(new Date()),
        formatSqlDate(p.updatedAt) || formatSqlDate(new Date()),
      ]
    );
  }

  // 7. Migrate Users (both authDb and storeDb)
  const authUsers = await authDb.collection('users').find({}).toArray();
  const storeUsers = await storeDb.collection('users').find({}).toArray();
  const allUsersMap = new Map();

  for (const u of [...storeUsers, ...authUsers]) {
    allUsersMap.set(u.email?.toLowerCase() || u._id.toString(), u);
  }

  console.log(`📦 Migrating ${allUsersMap.size} unique users...`);
  for (const u of allUsersMap.values()) {
    const id = u._id.toString();
    await mysqlConn.query(
      `REPLACE INTO users (id, name, email, password, image, phone, address, role, provider, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        u.name || '',
        u.email?.toLowerCase() || '',
        u.password || '',
        u.image || '',
        u.phone || '',
        u.address || '',
        u.role || 'customer',
        u.provider || 'credentials',
        formatSqlDate(u.createdAt) || formatSqlDate(new Date()),
        formatSqlDate(u.updatedAt) || formatSqlDate(new Date()),
      ]
    );
  }

  // 8. Migrate Orders
  const orders = await storeDb.collection('orders').find({}).toArray();
  console.log(`📦 Migrating ${orders.length} orders...`);
  for (const o of orders) {
    const id = o._id.toString();
    await mysqlConn.query(
      `REPLACE INTO orders (id, orderNumber, userId, customer, items, delivery, payment, pricing, status, timeline, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        o.orderNumber || `ZRZ-${id.slice(-6)}`,
        o.userId ? o.userId.toString() : null,
        JSON.stringify(o.customer || {}),
        JSON.stringify(o.items || []),
        JSON.stringify(o.delivery || {}),
        JSON.stringify(o.payment || {}),
        JSON.stringify(o.pricing || {}),
        o.status || 'Order Placed',
        JSON.stringify(o.timeline || []),
        formatSqlDate(o.createdAt) || formatSqlDate(new Date()),
        formatSqlDate(o.updatedAt) || formatSqlDate(new Date()),
      ]
    );
  }

  // 9. Migrate Server Accounts
  const serverAccounts = await serverAccDb.collection('accounts').find({}).toArray();
  console.log(`📦 Migrating ${serverAccounts.length} server accounts...`);
  for (const acc of serverAccounts) {
    const id = acc.id || acc.email || acc.username || acc._id.toString();
    if (!id || id === '__unregistered_attempts__') continue;
    await mysqlConn.query(
      `REPLACE INTO server_accounts (id, name, password, role, type, isActive, lastLoginAt, lastLoginIp, loginCount, successLogins, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        acc.name || id,
        acc.password || '',
        (acc.role || acc.type || 'ADMIN').toUpperCase(),
        (acc.type || acc.role || 'ADMIN').toUpperCase(),
        acc.isActive !== false ? 1 : 0,
        formatSqlDate(acc.lastLoginAt),
        acc.lastLoginIp || null,
        acc.loginCount || 0,
        acc.successLogins || 0,
        formatSqlDate(acc.createdAt) || formatSqlDate(new Date()),
        formatSqlDate(acc.updatedAt) || formatSqlDate(new Date()),
      ]
    );
  }

  // 10. Migrate Login Logs
  const loginLogs = await serverAccDb.collection('login_logs').find({}).toArray();
  console.log(`📦 Migrating ${loginLogs.length} login logs...`);
  for (const log of loginLogs) {
    const id = log._id ? log._id.toString() : `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await mysqlConn.query(
      `REPLACE INTO server_login_logs (id, accountId, name, type, role, ip, userAgent, status, message, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        log.accountId || log.username || 'unknown',
        log.name || log.accountId || 'System',
        (log.type || log.role || 'VIEWER').toUpperCase(),
        (log.role || log.type || 'VIEWER').toUpperCase(),
        log.ip || '',
        log.userAgent || '',
        log.status || 'SUCCESS',
        log.message || '',
        formatSqlDate(log.timestamp) || formatSqlDate(new Date()),
      ]
    );
  }

  // 11. Final Verification Counts in MySQL
  console.log('\n📊 Migration Summary & Verification in XAMPP MySQL:');
  const tables = ['categories', 'banners', 'products', 'users', 'orders', 'server_accounts', 'server_login_logs'];
  for (const table of tables) {
    const [rows] = await mysqlConn.query(`SELECT COUNT(*) as count FROM ${table}`);
    console.log(` - ${table}: ${rows[0].count} records`);
  }

  await mysqlConn.end();
  await mongoose.disconnect();
  console.log('\n🎉 ALL DATA MIGRATED TO XAMPP MYSQL SUCCESSFULLY!');
}

runMigration().catch((err) => {
  console.error('❌ Migration Failed:', err);
  process.exit(1);
});
