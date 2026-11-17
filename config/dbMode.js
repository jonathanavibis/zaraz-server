/**
 * Zaraz Database Engine Selector
 * Automatically routes to XAMPP MySQL when running locally,
 * and seamlessly routes to MongoDB Atlas when running in cloud serverless (Vercel).
 */

export const isVercelEnvironment = () => {
  return Boolean(
    process.env.VERCEL === '1' ||
    process.env.VERCEL ||
    process.env.NOW_REGION ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
  );
};

export const isMysqlMode = () => {
  const isVercel = isVercelEnvironment();
  const mysqlHost = (process.env.MYSQL_HOST || '').trim().toLowerCase();
  const isLocalMysql = !mysqlHost || mysqlHost === '127.0.0.1' || mysqlHost === 'localhost';

  // 1. On Vercel / Cloud Serverless:
  // Localhost (127.0.0.1:3306) does NOT exist inside AWS Lambda / Vercel containers.
  // Unless an explicit remote MySQL host is provided and DB_TYPE=mysql, ALWAYS use MongoDB Atlas.
  if (isVercel) {
    if (process.env.DB_TYPE === 'mysql' && !isLocalMysql) {
      return true; // Remote hosted MySQL on Cloud
    }
    return false; // MongoDB Atlas on Vercel
  }

  // 2. In Local Development:
  // If explicitly set to 'mongodb', use MongoDB Atlas.
  if (process.env.DB_TYPE && process.env.DB_TYPE.toLowerCase() === 'mongodb') {
    return false;
  }

  // Default for local development with XAMPP: MySQL
  return true;
};

export default isMysqlMode;
