import mongoose from 'mongoose';

let cachedConnection = null;
let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGODB_URL ||
    'mongodb+srv://zaraz-admin:6681CptbyrN76kua@cluster0.qlpxs02.mongodb.net/zaraz_db?retryWrites=true&w=majority';

  connectionPromise = mongoose
    .connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      tlsAllowInvalidCertificates: true,
    })
    .then((conn) => {
      cachedConnection = conn.connection || mongoose.connection;
      console.log(
        `[MongoDB Connected]: ${cachedConnection.host}/${cachedConnection.name}`
      );
      return cachedConnection;
    })
    .catch((error) => {
      console.error(`[MongoDB Connection Error]: ${error.message}`);
      cachedConnection = null;
      connectionPromise = null;
      throw error;
    });

  return connectionPromise;
};

/**
 * Returns the isolated database instance for Authentication and Users
 * Isolates user credentials in zaraz_auth_db on MongoDB Atlas
 */
export const getAuthDb = () => {
  const authDbName = process.env.AUTH_DB_NAME || 'zaraz_auth_db';
  return mongoose.connection.useDb(authDbName, { useCache: true });
};

export default connectDB;
