import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'zaraz_db',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  charset: 'utf8mb4',
});

/**
 * Execute a parameterized SQL query and return rows
 */
export const query = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

/**
 * Execute an INSERT / UPDATE / DELETE statement and return result metadata
 */
export const execute = async (sql, params = []) => {
  const [result] = await pool.execute(sql, params);
  return result;
};

/**
 * Test MySQL connectivity
 */
export const testMysqlConnection = async () => {
  try {
    const [rows] = await pool.query('SELECT 1 as ok, DATABASE() as db');
    return {
      connected: true,
      database: rows[0]?.db || process.env.MYSQL_DATABASE || 'zaraz_db',
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: process.env.MYSQL_PORT || 3306,
    };
  } catch (err) {
    console.error('[XAMPP MySQL Connection Error]:', err.message);
    return {
      connected: false,
      error: err.message,
    };
  }
};

export default pool;
