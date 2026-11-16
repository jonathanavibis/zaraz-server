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
      'Administrator authentication required. Please log in to the Admin Panel.',
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
 * Role-Based Access Control helper enforcing specific SERVER_ACC types.
 */
export const requireServerType = (...allowedTypes) => {
  const allowed = allowedTypes.flat().map((t) => String(t).toUpperCase());
  return (req, res, next) => {
    if (!req.serverAccount) {
      if (isHtmlRequest(req)) {
        const redirectTarget = getSafeRedirectTarget(req.originalUrl || '/');
        return res.redirect(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
      }
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Log in with SERVER_ACC credentials.',
      });
    }

    const currentType = (req.serverAccount.type || 'ADMIN').toUpperCase();
    if (allowed.length > 0 && !allowed.includes(currentType)) {
      if (isHtmlRequest(req)) {
        return res.status(403).send(`
          <div style="font-family: system-ui, sans-serif; background: #090d16; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem;">
            <div style="background: #0c1524; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 16px; padding: 2rem; max-width: 500px; text-align: center;">
              <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🛡️</div>
              <h2 style="font-size: 1.3rem; margin-bottom: 0.5rem;">403 Forbidden</h2>
              <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.25rem;">Requires [${allowed.join(', ')}] clearance. Your current role is <strong>${currentType}</strong>.</p>
              <a href="/" style="background: #10b981; color: #04170f; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 700; text-decoration: none;">Return to Dashboard</a>
            </div>
          </div>
        `);
      }
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires [${allowed.join(', ')}] clearance. Your current type is ${currentType}.`,
      });
    }

    return next();
  };
};

export const requireServerAdmin = requireServerType('ADMIN');

/**
 * Global gateway protecting ALL Admin Panel Dashboard HTML pages and administrator-only
 * mutations behind Administrator authentication, while keeping public
 * JSON APIs available for the Zaraz Shopping storefront.
 */
export const protectBackendGateway = (req, res, next) => {
  if (SERVER_AUTH_PUBLIC_PATHS.has(req.path)) {
    return next();
  }

  if (req.serverAccount) {
    const operatorType = (req.serverAccount.type || 'ADMIN').toUpperCase();
    const method = req.method.toUpperCase();
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    // 1. VIEWER is strictly read-only across all Admin Panel mutation endpoints
    if (isMutation && operatorType === 'VIEWER') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: VIEWER accounts have read-only access. Mutations are disabled in Admin Panel.',
      });
    }

    // 2. MODERATOR & WORKER cannot alter catalog structure (products, categories, banners)
    const isCatalogMutation =
      (req.path.startsWith('/products') ||
        req.path.startsWith('/api/products') ||
        req.path.startsWith('/categories') ||
        req.path.startsWith('/api/categories') ||
        req.path.startsWith('/banners') ||
        req.path.startsWith('/api/banners')) &&
      isMutation;

    if (isCatalogMutation && ['MODERATOR', 'WORKER'].includes(operatorType)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Only ADMIN and EDITOR accounts can mutate catalog items. Your current role is ${operatorType}.`,
      });
    }

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
        'Unauthorized: Administrator action requires Admin Panel login.',
      loginUrl: '/login',
    });
  }

  return next();
};
