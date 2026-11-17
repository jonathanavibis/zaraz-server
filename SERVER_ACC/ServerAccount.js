import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {
  getServerAccDb,
  initServerAccVault,
  SERVER_ACC_COLLECTION,
  SERVER_LOGIN_LOGS_COLLECTION,
  SERVER_ACC_DB_NAME,
} from './serverAccDb.js';
import {
  findServerAccountByIdentifierMysql,
  verifyAccountPasswordMysql,
  touchServerAccountLoginMysql,
  recordServerLoginLogMysql,
  getServerLoginLogsMysql,
  getAllServerAccountsMysql,
  deleteServerAccountMysql,
  createServerAccountMysql,
} from './serverAccountMysql.js';
import { isMysqlMode } from '../config/dbMode.js';

export const SERVER_ACC_TYPES = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  MODERATOR: 'MODERATOR',
  WORKER: 'WORKER',
  VIEWER: 'VIEWER',
};

export const normalizeServerAccType = (rawType) => {
  if (!rawType || typeof rawType !== 'string') return 'VIEWER';
  const upper = rawType.trim().toUpperCase();
  if (['ADMIN', 'SUPERADMIN', 'SERVER-ADMIN', 'OWNER', 'ROOT'].includes(upper)) return 'ADMIN';
  if (['EDITOR', 'EDIT', 'CONTENT-CREATOR'].includes(upper)) return 'EDITOR';
  if (['MODERATOR', 'MOD'].includes(upper)) return 'MODERATOR';
  if (['WORKER', 'STAFF', 'OPERATOR', 'EMPLOYEE'].includes(upper)) return 'WORKER';
  if (['VIEWER', 'VIEW', 'READONLY', 'READ-ONLY', 'GUEST', 'USER', 'VISITOR'].includes(upper)) return 'VIEWER';
  return 'VIEWER';
};

const IDENTIFIER_FIELDS = ['id', 'accountId', 'userId', 'adminId', 'username', 'email'];

const serverAccountSchema = new mongoose.Schema(
  {
    id: { type: String, trim: true },
    accountId: { type: String, trim: true },
    userId: { type: String, trim: true },
    adminId: { type: String, trim: true },
    username: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    password: { type: String },
    name: { type: String, trim: true },
    type: { type: String, default: 'ADMIN' },
    role: { type: String, default: 'ADMIN' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  {
    collection: SERVER_ACC_COLLECTION,
    strict: false,
    timestamps: true,
  }
);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const timingSafeStringCompare = (a, b) => {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
};

export const getAccountsCollection = async () => {
  const nativeDb = await initServerAccVault();
  return nativeDb.collection(SERVER_ACC_COLLECTION);
};

export const getServerAccountModel = () => {
  const db = getServerAccDb();
  return db.models.ServerAccount || db.model('ServerAccount', serverAccountSchema);
};

export const findServerAccountByIdentifier = async (rawIdentifier) => {
  if (isMysqlMode()) {
    try {
      const mysqlAccount = await findServerAccountByIdentifierMysql(rawIdentifier);
      if (mysqlAccount) return mysqlAccount;
    } catch (mysqlErr) {
      console.warn('[MySQL Query Warning - Falling back to MongoDB]:', mysqlErr.message);
    }
  }

  if (!rawIdentifier || typeof rawIdentifier !== 'string') return null;
  const trimmed = rawIdentifier.trim();
  if (!trimmed) return null;

  const collection = await getAccountsCollection();
  const exactInsensitive = new RegExp(`^${escapeRegex(trimmed)}$`, 'i');

  const orConditions = IDENTIFIER_FIELDS.map((field) => ({
    [field]: exactInsensitive,
  }));
  orConditions.push({ _id: trimmed });

  return collection.findOne({ $or: orConditions });
};

export const findServerAccountById = async (docId) => {
  if (isMysqlMode()) {
    try {
      const mysqlAccount = await findServerAccountByIdentifierMysql(docId);
      if (mysqlAccount) return mysqlAccount;
    } catch (mysqlErr) {
      console.warn('[MySQL Query Warning - Falling back to MongoDB]:', mysqlErr.message);
    }
  }

  if (!docId) return null;
  const collection = await getAccountsCollection();

  const queries = [{ _id: docId }, { _id: String(docId) }];
  if (mongoose.Types.ObjectId.isValid(docId)) {
    queries.unshift({ _id: new mongoose.Types.ObjectId(String(docId)) });
  }

  return collection.findOne({ $or: queries });
};

export const verifyAccountPassword = async (accountDoc, enteredPassword) => {
  if (isMysqlMode()) {
    return verifyAccountPasswordMysql(accountDoc, enteredPassword);
  }

  if (!accountDoc || typeof enteredPassword !== 'string' || !enteredPassword) {
    return false;
  }

  const stored = accountDoc.password ?? accountDoc.pass;
  if (typeof stored !== 'string' || !stored) {
    return false;
  }

  if (/^\$2[aby]\$\d{2}\$/.test(stored)) {
    return bcrypt.compare(enteredPassword, stored);
  }

  return timingSafeStringCompare(enteredPassword, stored);
};

export const touchServerAccountLogin = async (docId, meta = {}) => {
  if (!docId) return;

  if (isMysqlMode()) {
    try {
      await touchServerAccountLoginMysql(typeof docId === 'object' ? docId : { id: docId }, meta);
      return;
    } catch (err) {
      console.warn('[touchServerAccountLogin MySQL fallback]:', err.message);
    }
  }

  const collection = await getAccountsCollection();
  const queries = [{ _id: docId }, { _id: String(docId) }, { id: String(docId) }];
  if (mongoose.Types.ObjectId.isValid(docId)) {
    queries.unshift({ _id: new mongoose.Types.ObjectId(String(docId)) });
  }

  await collection.updateOne(
    { $or: queries },
    {
      $set: {
        lastLoginAt: new Date(),
        lastLoginIp: meta?.ip || '127.0.0.1',
      },
      $inc: { loginCount: 1, successLogins: 1 },
    }
  );
};

export const getLoginLogsCollection = async () => {
  const nativeDb = await initServerAccVault();
  return nativeDb.collection(SERVER_LOGIN_LOGS_COLLECTION);
};

export const recordServerLoginLog = async (logPayload = {}) => {
  if (isMysqlMode()) {
    try {
      return await recordServerLoginLogMysql(logPayload);
    } catch (err) {
      console.warn('[recordServerLoginLog MySQL fallback]:', err.message);
    }
  }

  try {
    const logsCollection = await getLoginLogsCollection();
    const accountsCollection = await getAccountsCollection();

    const { accountId, name, type, ip, userAgent, status, failureReason } = logPayload;

    let targetAccount = null;
    if (accountId) {
      targetAccount = await findServerAccountByIdentifier(String(accountId));
    }

    const resolvedType = targetAccount
      ? normalizeServerAccType(targetAccount.type || targetAccount.role)
      : (type ? normalizeServerAccType(type) : 'VIEWER');

    const resolvedName = (targetAccount && targetAccount.name)
      ? targetAccount.name
      : (name || accountId || 'Unknown Operator');

    const logDoc = {
      accountId: String(accountId || 'UNKNOWN'),
      name: String(resolvedName),
      type: resolvedType,
      ip: String(ip || '127.0.0.1'),
      userAgent: String(userAgent || 'Unknown Device'),
      status: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      failureReason: String(failureReason || ''),
      loggedAt: new Date(),
    };

    await logsCollection.insertOne(logDoc);

    if (targetAccount) {
      await accountsCollection.updateOne(
        { _id: targetAccount._id },
        {
          $set: {
            lastLoginAt: new Date(),
            lastLoginIp: String(ip || '127.0.0.1'),
            type: resolvedType,
            role: resolvedType,
          },
          $inc: { loginCount: 1 },
        }
      );
    }

    return logDoc;
  } catch (err) {
    console.error('[recordServerLoginLog Error]:', err.message);
    return null;
  }
};

export const getServerLoginLogs = async ({ limit = 100, page = 1 } = {}) => {
  if (isMysqlMode()) {
    try {
      const logs = await getServerLoginLogsMysql({ limit });
      return {
        total: logs.length,
        page: 1,
        limit,
        totalPages: 1,
        logs,
      };
    } catch (err) {
      console.warn('[getServerLoginLogs MySQL fallback]:', err.message);
    }
  }

  const [logsCollection, accountsCollection] = await Promise.all([
    getLoginLogsCollection(),
    getAccountsCollection(),
  ]);

  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 300);
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const skip = (parsedPage - 1) * parsedLimit;

  const [total, rawLogs, accounts] = await Promise.all([
    logsCollection.countDocuments(),
    logsCollection.find({}).sort({ loggedAt: -1 }).skip(skip).limit(parsedLimit).toArray(),
    accountsCollection.find({}).toArray(),
  ]);

  const accountTypeMap = new Map();
  for (const acc of accounts) {
    const accType = normalizeServerAccType(acc.type || acc.role);
    const accName = acc.name;
    IDENTIFIER_FIELDS.forEach((f) => {
      if (acc[f]) {
        accountTypeMap.set(String(acc[f]).toLowerCase(), { type: accType, name: accName });
      }
    });
    accountTypeMap.set(String(acc._id).toLowerCase(), { type: accType, name: accName });
  }

  const logs = rawLogs.map((log) => {
    const accountInfo = accountTypeMap.get(String(log.accountId || '').toLowerCase());
    const finalType = accountInfo ? accountInfo.type : normalizeServerAccType(log.type);
    const finalName = (accountInfo && accountInfo.name) ? accountInfo.name : (log.name || log.accountId);
    return {
      ...log,
      type: finalType,
      name: finalName,
    };
  });

  return {
    total,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit) || 1,
    logs,
  };
};

export const getAllServerAccounts = async () => {
  if (isMysqlMode()) {
    try {
      const accounts = await getAllServerAccountsMysql();
      if (accounts && accounts.length > 0) {
        return accounts.map(sanitizeServerAccount).filter(Boolean);
      }
    } catch (err) {
      console.warn('[getAllServerAccounts MySQL fallback]:', err.message);
    }
  }

  const collection = await getAccountsCollection();
  const docs = await collection.find({ isSystemBucket: { $ne: true } }).toArray();
  return docs.map(sanitizeServerAccount).filter(Boolean);
};

export const deleteServerAccount = async (id) => {
  if (isMysqlMode()) {
    try {
      const deleted = await deleteServerAccountMysql(id);
      if (deleted) return true;
    } catch (err) {
      console.warn('[deleteServerAccount MySQL fallback]:', err.message);
    }
  }
  const collection = await getAccountsCollection();
  const res = await collection.deleteOne({ $or: [{ id }, { _id: id }] });
  return res.deletedCount > 0;
};

export const sanitizeServerAccount = (doc) => {
  if (!doc || doc.isSystemBucket === true) return null;
  const identifier =
    doc.id ||
    doc.accountId ||
    doc.userId ||
    doc.adminId ||
    doc.username ||
    doc.email ||
    String(doc._id);

  const type = normalizeServerAccType(doc.type || doc.role);

  return {
    _id: String(doc._id || identifier),
    id: String(identifier),
    name: doc.name || String(identifier),
    type: type,
    role: type,
    isActive: doc.isActive !== false,
    lastLoginAt: doc.lastLoginAt || null,
    lastLoginIp: doc.lastLoginIp || '—',
    loginCount: doc.loginCount || 0,
    database: isMysqlMode() ? 'zaraz_db (XAMPP MySQL)' : SERVER_ACC_DB_NAME,
    collection: isMysqlMode() ? 'server_accounts' : SERVER_ACC_COLLECTION,
    permissions: {
      canDeleteUsers: type === 'ADMIN',
      canViewLoginLogs: type === 'ADMIN',
      canEditCatalog: ['ADMIN', 'EDITOR'].includes(type),
      canUpdateOrders: ['ADMIN', 'EDITOR', 'MODERATOR', 'WORKER'].includes(type),
      isReadOnly: type === 'VIEWER',
    },
  };
};
