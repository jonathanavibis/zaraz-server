import mongoose from 'mongoose';

let cachedConnection = null;

const connectDB = async () => {
  // If already connected, reuse existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedConnection && mongoose.connection.readyState !== 0) {
    return cachedConnection;
  }

  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.MONGODB_URL ||
      'mongodb+srv://zaraz-admin:6681CptbyrN76kua@cluster0.qlpxs02.mongodb.net/zaraz_db?retryWrites=true&w=majority';

    cachedConnection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      tlsAllowInvalidCertificates: true,
    });

    console.log(`[MongoDB Connected]: ${cachedConnection.connection.host}/${cachedConnection.connection.name}`);
    return cachedConnection;
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    cachedConnection = null;
    throw error;
  }
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
