import mongoose from 'mongoose';
import connectDB from '../config/db.js';

export const SERVER_ACC_DB_NAME = process.env.SERVER_ACC_DB_NAME || 'SERVER_ACC';
export const SERVER_ACC_COLLECTION = 'accounts';

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
 * Ensures MongoDB connection is active and initializes the empty `accounts`
 * collection inside the `SERVER_ACC` database without inserting any demo credentials.
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
        `[SERVER_ACC] Created isolated MongoDB vault: ${SERVER_ACC_DB_NAME}.${SERVER_ACC_COLLECTION}`
      );
    }

    vaultInitialized = true;
  }

  return nativeDb;
};
