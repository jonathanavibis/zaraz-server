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
  type = '',
  ip = '',
  userAgent = '',
  status = 'SUCCESS',
  failureReason = '',
}) => {
  try {
    const logsCollection = await getLoginLogsCollection();
    const accountsCollection = await getAccountsCollection();
    const targetAccount = accountId ? await findServerAccountByIdentifier(String(accountId)) : null;

    // Resolve accurate operator type and name strictly from target account in SERVER_ACC.accounts if available
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

    // Also update last login info on the account in SERVER_ACC.accounts
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

/**
 * Retrieves audit login logs directly from the separate `SERVER_ACC.login_logs` collection.
 * Dynamically reconciles operator types with registered accounts to guarantee the tag
 * always accurately displays the operator's actual assigned role (e.g. VIEWER).
 */
export const getServerLoginLogs = async ({ limit = 100, page = 1 } = {}) => {
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

  // Build account lookup map to ensure logs dynamically reflect the operator's current account type & name
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
