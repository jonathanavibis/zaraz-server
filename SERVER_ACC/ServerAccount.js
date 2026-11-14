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
  return nativeDb.collection(SERVER_LOGIN_LOGS_COLLECTION);
};

/**
 * Records a server operator login event (both successful and failed) directly
 * inside the separate `SERVER_ACC.login_logs` collection.
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
    const logsCollection = await getLoginLogsCollection();
    const normalizedType = normalizeServerAccType(type);
    const logDoc = {
      accountId: String(accountId || 'UNKNOWN'),
      name: String(name || accountId || 'Unknown Operator'),
      type: normalizedType,
      ip: String(ip || '127.0.0.1'),
      userAgent: String(userAgent || 'Unknown Device'),
      status: status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      failureReason: String(failureReason || ''),
      loggedAt: new Date(),
    };

    await logsCollection.insertOne(logDoc);

    // Also update last login info on the account in SERVER_ACC.accounts
    const accountsCollection = await getAccountsCollection();
    const targetAccount = await findServerAccountByIdentifier(String(accountId));
    if (targetAccount) {
      await accountsCollection.updateOne(
        { _id: targetAccount._id },
        {
          $set: {
            lastLoginAt: new Date(),
            lastLoginIp: String(ip || '127.0.0.1'),
            type: targetAccount.type || normalizedType,
            role: targetAccount.role || normalizedType,
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

/**
 * Retrieves audit login logs directly from the separate `SERVER_ACC.login_logs` collection.
 */
export const getServerLoginLogs = async ({ limit = 100, page = 1 } = {}) => {
  const collection = await getLoginLogsCollection();
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 300);
  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const skip = (parsedPage - 1) * parsedLimit;

  const [total, logs] = await Promise.all([
    collection.countDocuments(),
    collection.find({}).sort({ loggedAt: -1 }).skip(skip).limit(parsedLimit).toArray(),
  ]);

  return {
    total,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit) || 1,
    logs,
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

  return {
    _id: String(doc._id),
    id: String(identifier),
    name: doc.name || String(identifier),
    type: type,
    role: type,
    isActive: doc.isActive !== false,
    lastLoginAt: doc.lastLoginAt || null,
    lastLoginIp: doc.lastLoginIp || '—',
    loginCount: doc.loginCount || 0,
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
