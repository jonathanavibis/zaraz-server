import jwt from 'jsonwebtoken';
import { isHtmlRequest } from '../utils/viewRenderer.js';
import {
  findServerAccountById,
  sanitizeServerAccount,
} from './ServerAccount.js';
import {
  serverContextStorage,
  getCurrentServerAccount,
} from './serverSessionContext.js';

export { getCurrentServerAccount };
export const SERVER_ACC_COOKIE_NAME = 'zaraz_server_acc_token';

export const getServerAccJwtSecret = () =>
  process.env.SERVER_ACC_JWT_SECRET ||
  process.env.JWT_SECRET ||
  'zaraz_super_secret_jwt_key_2026_green_black';

export const parseCookies = (req) => {
  const header = req.headers?.cookie;
  const cookies = {};
  if (!header || typeof header !== 'string') return cookies;

  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const rawVal = part.slice(idx + 1).trim();
    if (!key) continue;
    try {
      cookies[key] = decodeURIComponent(rawVal);
    } catch {
      cookies[key] = rawVal;
    }
  }
  return cookies;
};

export const getSafeRedirectTarget = (rawTarget) => {
  if (typeof rawTarget !== 'string') return '/';
  const trimmed = rawTarget.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    trimmed.startsWith('/login') ||
    trimmed.startsWith('/logout')
  ) {
    return '/';
  }
  return trimmed;
};

export const extractServerToken = (req) => {
  const cookies = parseCookies(req);
  if (cookies[SERVER_ACC_COOKIE_NAME]) {
    return cookies[SERVER_ACC_COOKIE_NAME];
  }

  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
};

export const resolveServerSession = async (req) => {
  const token = extractServerToken(req);
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getServerAccJwtSecret());
    if (!decoded || decoded.scope !== 'server_acc' || !decoded.docId) {
      return null;
    }

    const accountDoc = await findServerAccountById(decoded.docId);
    if (!accountDoc || accountDoc.isActive === false) {
      return null;
    }

    return sanitizeServerAccount(accountDoc);
  } catch {
    return null;
  }
};

/**
 * Attaches verified `req.serverAccount` (from SERVER_ACC.accounts) onto every
 * request and stores it in AsyncLocalStorage for shared layout rendering.
 */
export const attachServerSession = async (req, res, next) => {
  try {
    const account = await resolveServerSession(req);
    req.serverAccount = account;
    res.locals.serverAccount = account;
    return serverContextStorage.run(account, () => next());
  } catch {
    req.serverAccount = null;
    res.locals.serverAccount = null;
    return serverContextStorage.run(null, () => next());
  }
};

/**
 * Enforces SERVER_ACC login on explicit routes.
 */
export const requireServerAdminSession = (req, res, next) => {
  if (req.serverAccount) return next();

  if (isHtmlRequest(req)) {
    const redirectTarget = getSafeRedirectTarget(req.originalUrl || '/');
    return res.redirect(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
  }

  return res.status(401).json({
    success: false,
    message:
      'Backend authentication required. Log in with SERVER_ACC MongoDB credentials.',
    loginUrl: '/login',
  });
};

const SERVER_AUTH_PUBLIC_PATHS = new Set([
  '/login',
  '/server-login',
  '/server-acc/login',
  '/logout',
  '/server-acc/logout',
  '/register',
  '/signup',
  '/server-acc/register',
  '/server-acc/signup',
]);

const isProtectedAdminApiRequest = (req) => {
  const path = req.path;
  const method = req.method.toUpperCase();

  if (path === '/seed' || path === '/api/seed') return true;
  if (path === '/auth' || path === '/api/auth') return true;
  if (path === '/auth/stats' || path === '/api/auth/stats') return true;
  if (path.startsWith('/server-acc')) return true;

  if (
    (path.startsWith('/products/') || path.startsWith('/api/products/')) &&
    ['PUT', 'PATCH', 'DELETE'].includes(method)
  ) {
    return true;
  }

  if (
    (path.startsWith('/orders/') || path.startsWith('/api/orders/')) &&
    path.endsWith('/status')
  ) {
    return true;
  }

  if (
    (path === '/categories' ||
      path === '/api/categories' ||
      path === '/banners' ||
      path === '/api/banners') &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  ) {
    return true;
  }

  return false;
};

/**
 * Global gateway protecting ALL Backend Server Dashboard HTML pages and admin-only
 * backend mutations behind SERVER_ACC MongoDB authentication, while keeping public
 * JSON APIs available for the Zaraz Shopping storefront.
 */
export const protectBackendGateway = (req, res, next) => {
  if (SERVER_AUTH_PUBLIC_PATHS.has(req.path)) {
    return next();
  }

  if (req.serverAccount) {
    return next();
  }

  if (isHtmlRequest(req)) {
    const redirectTarget = getSafeRedirectTarget(req.originalUrl || '/');
    return res.redirect(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
  }

  if (isProtectedAdminApiRequest(req)) {
    return res.status(401).json({
      success: false,
      message:
        'Unauthorized: Backend admin action requires SERVER_ACC login.',
      loginUrl: '/login',
    });
  }

  return next();
};
