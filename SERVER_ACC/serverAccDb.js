import mongoose from 'mongoose';
import connectDB from '../config/db.js';

export const SERVER_ACC_DB_NAME = process.env.SERVER_ACC_DB_NAME || 'SERVER_ACC';
export const SERVER_ACC_COLLECTION = 'accounts';
// Unified: Login logs are embedded directly inside SERVER_ACC.accounts
export const SERVER_LOGIN_LOGS_COLLECTION = 'accounts';

let vaultInitialized = false;

/**
 * Returns the completely isolated MongoDB database handle for SERVER_ACC.
 * Backend Server Admin IDs & Passwords live exclusively in SERVER_ACC.accounts,
 * separated from storefront customer accounts (zaraz_auth_db) and catalog (zaraz_db).
 */
export const getServerAccDb = () => {
  return mongoose.connection.useDb(SERVER_ACC_DB_NAME, { useCache: true });
};

export const getNativeServerAccDb = async () => {
  await connectDB();
  const useDbConn = getServerAccDb();
  if (useDbConn?.db) return useDbConn.db;
  return mongoose.connection.getClient().db(SERVER_ACC_DB_NAME);
};

/**
 * Ensures MongoDB connection is active and initializes the unified `accounts`
 * collection inside the `SERVER_ACC` database where both Accounts and Login Logs reside together.
 */
export const initServerAccVault = async () => {
  const nativeDb = await getNativeServerAccDb();

  if (!vaultInitialized && nativeDb) {
    const existing = await nativeDb
      .listCollections({ name: SERVER_ACC_COLLECTION })
      .toArray();

    if (existing.length === 0) {
      await nativeDb.createCollection(SERVER_ACC_COLLECTION);
      console.log(
        `[SERVER_ACC] Created unified MongoDB vault: ${SERVER_ACC_DB_NAME}.${SERVER_ACC_COLLECTION}`
      );
    }

    // Auto-migrate any legacy login_logs collection into accounts so there is strictly 1 unified collection
    const existingLogs = await nativeDb
      .listCollections({ name: 'login_logs' })
      .toArray();

    if (existingLogs.length > 0) {
      try {
        const legacyLogsCol = nativeDb.collection('login_logs');
        const accountsCol = nativeDb.collection(SERVER_ACC_COLLECTION);
        const orphanLogs = await legacyLogsCol.find({}).toArray();

        for (const log of orphanLogs) {
          const accountId = log.accountId;
          const accountDoc = await accountsCol.findOne({
            $or: [
              { id: accountId },
              { email: accountId },
              { username: accountId },
              { accountId: accountId },
            ],
          });

          const logItem = {
            logId: log._id ? String(log._id) : undefined,
            status: log.status,
            ip: log.ip,
            userAgent: log.userAgent,
            failureReason: log.failureReason || '',
            loggedAt: log.loggedAt || new Date(),
          };

          if (accountDoc) {
            await accountsCol.updateOne(
              { _id: accountDoc._id },
              {
                $addToSet: { login_logs: logItem },
                $set: { lastLoginAt: log.loggedAt, lastLoginIp: log.ip },
                $inc: { loginCount: 1 },
              }
            );
          } else {
            await accountsCol.updateOne(
              { id: '__unregistered_attempts__' },
              {
                $setOnInsert: {
                  id: '__unregistered_attempts__',
                  name: 'Unregistered Identifier Attempts',
                  type: 'VIEWER',
                  isActive: false,
                  isSystemBucket: true,
                },
                $addToSet: { login_logs: logItem },
              },
              { upsert: true }
            );
          }
        }

        await legacyLogsCol.drop().catch(() => {});
        console.log(`[SERVER_ACC] Migrated & unified login_logs into ${SERVER_ACC_COLLECTION}`);
      } catch (migErr) {
        console.error('[SERVER_ACC Migration Error]:', migErr.message);
      }
    }

    vaultInitialized = true;
  }

  return nativeDb;
};
