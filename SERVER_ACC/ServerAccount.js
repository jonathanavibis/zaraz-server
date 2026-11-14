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

export const SERVER_ACC_TYPES = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  MODERATOR: 'MODERATOR',
  WORKER: 'WORKER',
  VIEWER: 'VIEWER',
};

export const normalizeServerAccType = (rawType) => {
  if (!rawType || typeof rawType !== 'string') return 'ADMIN';
  const upper = rawType.trim().toUpperCase();
  if (['ADMIN', 'SUPERADMIN', 'SERVER-ADMIN', 'OWNER'].includes(upper)) return 'ADMIN';
  if (['EDITOR', 'EDIT'].includes(upper)) return 'EDITOR';
  if (['MODERATOR', 'MOD'].includes(upper)) return 'MODERATOR';
  if (['WORKER', 'STAFF', 'OPERATOR'].includes(upper)) return 'WORKER';
  if (['VIEWER', 'READONLY', 'GUEST'].includes(upper)) return 'VIEWER';
  return 'ADMIN';
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
    role: { type: String, default: 'server-admin' },
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

/**
 * Retrieve raw MongoDB collection handle for SERVER_ACC.accounts so manually
 * created documents in MongoDB Atlas/Compass work with flexible field names.
 */
export const getAccountsCollection = async () => {
  const nativeDb = await initServerAccVault();
  return nativeDb.collection(SERVER_ACC_COLLECTION);
};

/**
 * Mongoose model bound strictly to SERVER_ACC.accounts.
 */
export const getServerAccountModel = () => {
  const db = getServerAccDb();
  return db.models.ServerAccount || db.model('ServerAccount', serverAccountSchema);
};

/**
 * Finds a backend server account in SERVER_ACC.accounts by any identifier field
 * (`id`, `accountId`, `userId`, `adminId`, `username`, `email`, or string `_id`).
 */
export const findServerAccountByIdentifier = async (rawIdentifier) => {
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

/**
 * Finds a backend server account document by MongoDB `_id` (ObjectId or string).
 */
export const findServerAccountById = async (docId) => {
  if (!docId) return null;
  const collection = await getAccountsCollection();

  const queries = [{ _id: docId }, { _id: String(docId) }];
  if (mongoose.Types.ObjectId.isValid(docId)) {
    queries.unshift({ _id: new mongoose.Types.ObjectId(String(docId)) });
  }

  return collection.findOne({ $or: queries });
};

/**
 * Verifies entered password against stored `password` or `pass` field.
 * Supports both bcrypt hashes ($2a$/$2b$/$2y$) and plain-text values inserted
 * directly via MongoDB Atlas / Compass.
 */
export const verifyAccountPassword = async (accountDoc, enteredPassword) => {
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

/**
 * Marks last successful login timestamp on the MongoDB SERVER_ACC document.
 */
export const touchServerAccountLogin = async (docId) => {
  if (!docId) return;
  const collection = await getAccountsCollection();
  await collection.updateOne(
    { _id: docId },
    { $set: { lastLoginAt: new Date() } }
  );
};

export const getLoginLogsCollection = async () => {
  const nativeDb = await initServerAccVault();
  return nativeDb.collection(SERVER_ACC_COLLECTION);
};

/**
 * Records a server operator login event (both successful and failed) directly
 * inside the unified `SERVER_ACC.accounts` document matching the operator.
 * Accounts and login logs are stored together in one single collection.
 */
export const recordServerLoginLog = async ({
  accountId,
  name = '',
  type = 'ADMIN',
  ip = '',
  userAgent = '',
  status = 'SUCCESS',
  failureReason = '',
}) => {
  try {
    const collection = await getAccountsCollection();
    const normalizedType = normalizeServerAccType(type);
    const logDoc = {
      logId: new mongoose.Types.ObjectId().toString(),
      accountId: String(accountId || 'UNKNOWN'),
      name: String(name || accountId || 'Unknown Operator'),
      type: normalizedType,
      ip: String(ip || '127.0.0.1'),
      userAgent: String(userAgent || 'Unknown Device'),
      status: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      failureReason: String(failureReason || ''),
      loggedAt: new Date(),
    };

    const targetAccount = await findServerAccountByIdentifier(String(accountId));

    if (targetAccount) {
      await collection.updateOne(
        { _id: targetAccount._id },
        {
          $set: {
            lastLoginAt: new Date(),
            lastLoginIp: String(ip || '127.0.0.1'),
          },
          $inc: {
            loginCount: 1,
            ...(status === 'SUCCESS' ? { successLogins: 1 } : { failedLogins: 1 }),
          },
          $push: {
            login_logs: {
              $each: [logDoc],
              $position: 0,
              $slice: 150, // Retain latest 150 login events per account
            },
          },
        }
      );
    } else {
      // Store failed attempts for non-existent identifiers in a unified audit bucket document in accounts
      await collection.updateOne(
        { id: '__unregistered_attempts__' },
        {
          $setOnInsert: {
            id: '__unregistered_attempts__',
            name: 'Unregistered Identifier Attempts',
            type: 'VIEWER',
            role: 'VIEWER',
            isActive: false,
            isSystemBucket: true,
            createdAt: new Date(),
          },
          $set: {
            lastAttemptAt: new Date(),
            lastAttemptIp: String(ip || '127.0.0.1'),
          },
          $inc: { attemptCount: 1 },
          $push: {
            login_logs: {
              $each: [logDoc],
              $position: 0,
              $slice: 150,
            },
          },
        },
        { upsert: true }
      );
    }

    return logDoc;
  } catch (err) {
    console.error('[recordServerLoginLog Error]:', err.message);
    return null;
  }
};

/**
 * Retrieves audit login logs by aggregating embedded `login_logs` arrays
 * from all documents in the unified `SERVER_ACC.accounts` collection.
 */
export const getServerLoginLogs = async ({ limit = 100, page = 1 } = {}) => {
  const collection = await getAccountsCollection();
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 300);
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const skip = (parsedPage - 1) * parsedLimit;

  const accounts = await collection.find({}).toArray();

  let allLogs = [];
  for (const acc of accounts) {
    if (Array.isArray(acc.login_logs)) {
      for (const item of acc.login_logs) {
        allLogs.push({
          logId: item.logId || item._id ? String(item.logId || item._id) : undefined,
          accountId: item.accountId || acc.id || acc.email || String(acc._id),
          name: item.name || acc.name || 'Server Operator',
          type: normalizeServerAccType(item.type || acc.type || acc.role),
          ip: item.ip || '127.0.0.1',
          userAgent: item.userAgent || 'Unknown Device',
          status: item.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
          failureReason: item.failureReason || '',
          loggedAt: item.loggedAt ? new Date(item.loggedAt) : new Date(),
        });
      }
    }
  }

  // Sort newest first
  allLogs.sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));

  const total = allLogs.length;
  const pagedLogs = allLogs.slice(skip, skip + parsedLimit);

  return {
    total,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit) || 1,
    logs: pagedLogs,
  };
};

/**
 * Retrieves all registered server operator accounts from `SERVER_ACC.accounts`.
 */
export const getAllServerAccounts = async () => {
  const collection = await getAccountsCollection();
  const docs = await collection.find({ isSystemBucket: { $ne: true } }).toArray();
  return docs.map(sanitizeServerAccount).filter(Boolean);
};

/**
 * Strips sensitive credential fields before attaching to request or JSON response.
 * Normalizes account type (ADMIN, EDITOR, MODERATOR, WORKER, VIEWER) and maps permission flags.
 */
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
  const logs = Array.isArray(doc.login_logs) ? doc.login_logs : [];

  return {
    _id: String(doc._id),
    id: String(identifier),
    name: doc.name || String(identifier),
    type: type,
    role: type,
    isActive: doc.isActive !== false,
    lastLoginAt: doc.lastLoginAt || logs[0]?.loggedAt || null,
    lastLoginIp: doc.lastLoginIp || logs[0]?.ip || '—',
    loginCount: doc.loginCount || logs.length || 0,
    logsCount: logs.length,
    recentLogs: logs.slice(0, 5),
    database: SERVER_ACC_DB_NAME,
    collection: SERVER_ACC_COLLECTION,
    permissions: {
      canDeleteUsers: type === 'ADMIN',
      canViewLoginLogs: type === 'ADMIN',
      canEditCatalog: ['ADMIN', 'EDITOR'].includes(type),
      canUpdateOrders: ['ADMIN', 'EDITOR', 'MODERATOR', 'WORKER'].includes(type),
      isReadOnly: type === 'VIEWER',
    },
  };
};
