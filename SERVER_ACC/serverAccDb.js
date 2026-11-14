import mongoose from 'mongoose';
import connectDB from '../config/db.js';

export const SERVER_ACC_DB_NAME = process.env.SERVER_ACC_DB_NAME || 'SERVER_ACC';
export const SERVER_ACC_COLLECTION = 'accounts';
export const SERVER_LOGIN_LOGS_COLLECTION = 'login_logs';

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
 * Ensures MongoDB connection is active and initializes both:
 * 1. SERVER_ACC.accounts (Server Operator Accounts with mandatory `type` field)
 * 2. SERVER_ACC.login_logs (Dedicated separate Login Audit Log collection)
 */
export const initServerAccVault = async () => {
  const nativeDb = await getNativeServerAccDb();

  if (!vaultInitialized && nativeDb) {
    const collections = await nativeDb.listCollections().toArray();
    const colNames = new Set(collections.map((c) => c.name));

    // 1. Ensure accounts collection exists
    if (!colNames.has(SERVER_ACC_COLLECTION)) {
      await nativeDb.createCollection(SERVER_ACC_COLLECTION);
      console.log(
        `[SERVER_ACC] Created isolated MongoDB vault: ${SERVER_ACC_DB_NAME}.${SERVER_ACC_COLLECTION}`
      );
    }

    // 2. Ensure login_logs collection exists (completely separate)
    if (!colNames.has(SERVER_LOGIN_LOGS_COLLECTION)) {
      await nativeDb.createCollection(SERVER_LOGIN_LOGS_COLLECTION);
      console.log(
        `[SERVER_ACC] Created separate audit collection: ${SERVER_ACC_DB_NAME}.${SERVER_LOGIN_LOGS_COLLECTION}`
      );
    }

    // 3. Ensure EVERY account document in accounts has 'type' explicitly set
    try {
      const accountsCol = nativeDb.collection(SERVER_ACC_COLLECTION);

      // Clean up any old system bucket doc or embedded login_logs
      await accountsCol.deleteMany({
        $or: [{ id: '__unregistered_attempts__' }, { isSystemBucket: true }],
      });
      await accountsCol.updateMany({}, { $unset: { login_logs: '' } });

      // Add 'type: ADMIN' and 'role: ADMIN' to any account lacking type
      const accountsWithoutType = await accountsCol
        .find({ $or: [{ type: { $exists: false } }, { type: null }, { type: '' }] })
        .toArray();

      for (const acc of accountsWithoutType) {
        const assignedType = (acc.role || 'ADMIN').toUpperCase();
        await accountsCol.updateOne(
          { _id: acc._id },
          { $set: { type: assignedType, role: assignedType } }
        );
      }
    } catch (err) {
      console.error('[initServerAccVault type migration error]:', err.message);
    }

    vaultInitialized = true;
  }

  return nativeDb;
};
