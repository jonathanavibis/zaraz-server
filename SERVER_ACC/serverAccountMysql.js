import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query as sqlQuery, execute as sqlExecute } from '../config/mysqlDb.js';
import { generateId, formatSqlDate } from '../models/mysql/helpers.js';
import { normalizeServerAccType } from './ServerAccount.js';

const timingSafeStringCompare = (a, b) => {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
};

export const findServerAccountByIdentifierMysql = async (rawIdentifier) => {
  if (!rawIdentifier || typeof rawIdentifier !== 'string') return null;
  const cleanId = rawIdentifier.trim();
  const sql = `SELECT * FROM server_accounts WHERE id = ? LIMIT 1`;
  const rows = await sqlQuery(sql, [cleanId]);
  if (!rows || rows.length === 0) return null;

  const row = rows[0];
  const type = normalizeServerAccType(row.type || row.role);
  return {
    _id: String(row.id),
    id: String(row.id),
    name: row.name || row.id,
    password: row.password,
    role: type,
    type: type,
    isActive: Boolean(row.isActive),
    lastLoginAt: row.lastLoginAt,
    lastLoginIp: row.lastLoginIp,
    loginCount: Number(row.loginCount || 0),
    successLogins: Number(row.successLogins || 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

export const verifyAccountPasswordMysql = async (account, candidatePassword) => {
  if (!account || !account.password || candidatePassword === undefined || candidatePassword === null) {
    return false;
  }

  const stored = String(account.password);
  const candidate = String(candidatePassword);

  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    try {
      return await bcrypt.compare(candidate, stored);
    } catch {
      return false;
    }
  }

  return timingSafeStringCompare(stored, candidate);
};

export const touchServerAccountLoginMysql = async (account, { ip, userAgent } = {}) => {
  if (!account || !account.id) return;
  const now = formatSqlDate(new Date());
  const sql = `
    UPDATE server_accounts
    SET lastLoginAt = ?, lastLoginIp = ?, loginCount = loginCount + 1, successLogins = successLogins + 1, updatedAt = ?
    WHERE id = ?
  `;
  await sqlExecute(sql, [now, ip || '127.0.0.1', now, account.id]);
};

export const recordServerLoginLogMysql = async (logPayload = {}) => {
  const id = generateId();
  const accountId = logPayload.accountId || logPayload.username || 'unknown';
  const name = logPayload.name || accountId;
  const type = normalizeServerAccType(logPayload.type || logPayload.role);
  const now = formatSqlDate(new Date());

  const sql = `
    INSERT INTO server_login_logs (id, accountId, name, type, role, ip, userAgent, status, message, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await sqlExecute(sql, [
    id,
    accountId,
    name,
    type,
    type,
    logPayload.ip || '127.0.0.1',
    logPayload.userAgent || '',
    logPayload.status || 'SUCCESS',
    logPayload.message || '',
    now,
  ]);
};

export const getServerLoginLogsMysql = async ({ limit = 50 } = {}) => {
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 50);
  const sql = `SELECT * FROM server_login_logs ORDER BY timestamp DESC LIMIT ${parsedLimit}`;
  const rows = await sqlQuery(sql);

  return rows.map((r) => {
    const rawType = r.type || r.role;
    const normalizedType = normalizeServerAccType(rawType);
    return {
      _id: String(r.id),
      id: String(r.id),
      accountId: r.accountId,
      name: r.name || r.accountId,
      type: normalizedType,
      role: normalizedType,
      ip: r.ip,
      userAgent: r.userAgent,
      status: r.status,
      message: r.message,
      timestamp: r.timestamp,
    };
  });
};

export const getAllServerAccountsMysql = async () => {
  const sql = `SELECT * FROM server_accounts ORDER BY createdAt ASC`;
  const rows = await sqlQuery(sql);

  return rows.map((r) => {
    const rawType = r.type || r.role;
    const normalizedType = normalizeServerAccType(rawType);
    return {
      _id: String(r.id),
      id: String(r.id),
      name: r.name || r.id,
      password: r.password,
      type: normalizedType,
      role: normalizedType,
      isActive: Boolean(r.isActive),
      lastLoginAt: r.lastLoginAt,
      lastLoginIp: r.lastLoginIp,
      loginCount: Number(r.loginCount || 0),
      successLogins: Number(r.successLogins || 0),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  });
};

export const deleteServerAccountMysql = async (accountId) => {
  if (!accountId) return false;
  const result = await sqlExecute(`DELETE FROM server_accounts WHERE id = ?`, [String(accountId)]);
  return result.affectedRows > 0;
};

export const createServerAccountMysql = async ({ id, name, password, type, role }) => {
  const cleanId = String(id).trim();
  const normalizedType = normalizeServerAccType(type || role || 'ADMIN');
  const now = formatSqlDate(new Date());

  const sql = `
    INSERT INTO server_accounts (id, name, password, role, type, isActive, loginCount, successLogins, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, 1, 0, 0, ?, ?)
    ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password), type = VALUES(type), role = VALUES(role), updatedAt = VALUES(updatedAt)
  `;

  await sqlExecute(sql, [cleanId, name || cleanId, password, normalizedType, normalizedType, now, now]);
  return findServerAccountByIdentifierMysql(cleanId);
};
