import jwt from 'jsonwebtoken';
import {
  findServerAccountByIdentifier,
  verifyAccountPassword,
  touchServerAccountLogin,
  sanitizeServerAccount,
  recordServerLoginLog,
  getServerLoginLogs,
  getAllServerAccounts,
  SERVER_ACC_TYPES,
  normalizeServerAccType,
} from './ServerAccount.js';
import {
  SERVER_ACC_COOKIE_NAME,
  getServerAccJwtSecret,
  getSafeRedirectTarget,
} from './serverAuthMiddleware.js';
import { SERVER_ACC_DB_NAME, SERVER_ACC_COLLECTION } from './serverAccDb.js';
import { renderBaseLayout, isHtmlRequest } from '../utils/viewRenderer.js';

const escapeHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isHttpsRequest = (req) =>
  req.secure ||
  req.headers['x-forwarded-proto'] === 'https' ||
  process.env.NODE_ENV === 'production';

const setServerAuthCookie = (req, res, token) => {
  res.cookie(SERVER_ACC_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttpsRequest(req),
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
};

const signServerAccToken = (account) =>
  jwt.sign(
    {
      scope: 'server_acc',
      docId: account._id,
      id: account.id,
      name: account.name,
      role: account.type || account.role,
      type: account.type || account.role,
    },
    getServerAccJwtSecret(),
    { expiresIn: '24h' }
  );

const buildLoginPageHtml = ({ redirectTarget = '/', errorMessage = '' } = {}) => {
  const safeRedirect = escapeHtml(redirectTarget);
  const safeError = errorMessage ? escapeHtml(errorMessage) : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Panel Login • Zaraz Administrator</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background-color: #090d16;
      color: #e2e8f0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background-image:
        radial-gradient(ellipse 75% 50% at 50% -10%, rgba(16, 185, 129, 0.16), transparent),
        radial-gradient(ellipse 50% 40% at 90% 100%, rgba(4, 120, 87, 0.12), transparent),
        linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 36px 36px, 36px 36px;
    }

    .login-shell {
      width: 100%;
      max-width: 440px;
      background: #0c1524;
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 22px;
      padding: 2.25rem;
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.65), 0 0 40px rgba(16, 185, 129, 0.12);
      position: relative;
      overflow: hidden;
    }

    .login-shell::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, #047857, #10b981, #34d399);
    }

    .brand-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.75rem;
    }

    .brand-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-pill {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #10b981, #047857);
      color: #04170f;
      font-weight: 900;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 18px rgba(16, 185, 129, 0.35);
    }

    .brand-name {
      font-size: 1.1rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .brand-sub {
      font-size: 0.72rem;
      color: #34d399;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }

    .vault-badge {
      font-size: 0.68rem;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
      color: #34d399;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.35);
      padding: 0.3rem 0.65rem;
      border-radius: 9999px;
      letter-spacing: 0.04em;
    }

    .heading {
      font-size: 1.55rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 0.4rem;
      letter-spacing: -0.02em;
    }

    .subheading {
      font-size: 0.84rem;
      color: #94a3b8;
      margin-bottom: 1.65rem;
      line-height: 1.5;
    }

    .error-banner {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.45);
      color: #fca5a5;
      border-radius: 12px;
      padding: 0.8rem 1rem;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
      display: ${safeError ? 'flex' : 'none'};
      align-items: flex-start;
      gap: 0.5rem;
    }

    .form-group {
      margin-bottom: 1.15rem;
    }

    .form-group label {
      display: block;
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #94a3b8;
      margin-bottom: 0.45rem;
    }

    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .form-control {
      width: 100%;
      background: #060a12;
      border: 1px solid #162a42;
      border-radius: 11px;
      padding: 0.78rem 1rem;
      color: #ffffff;
      font-size: 0.9rem;
      font-family: inherit;
      outline: none;
      transition: all 0.2s ease;
    }

    .form-control:focus {
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    }

    .toggle-pass {
      position: absolute;
      right: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid #1e3550;
      color: #94a3b8;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.25rem 0.55rem;
      border-radius: 6px;
      cursor: pointer;
    }
    .toggle-pass:hover { color: #ffffff; border-color: #10b981; }

    .btn-login {
      width: 100%;
      margin-top: 0.5rem;
      padding: 0.88rem 1.25rem;
      background: linear-gradient(135deg, #10b981, #059669);
      color: #04170f;
      font-size: 0.92rem;
      font-weight: 900;
      border: none;
      border-radius: 11px;
      cursor: pointer;
      font-family: inherit;
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    .btn-login:hover {
      background: linear-gradient(135deg, #34d399, #10b981);
      transform: translateY(-1px);
    }
    .btn-login:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      transform: none;
    }

    .security-footer {
      margin-top: 1.5rem;
      padding-top: 1.15rem;
      border-top: 1px solid #13273c;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      font-size: 0.73rem;
      color: #64748b;
    }

    .security-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .mono-pill {
      font-family: 'JetBrains Mono', monospace;
      color: #34d399;
      background: rgba(16, 185, 129, 0.08);
      padding: 0.15rem 0.45rem;
      border-radius: 6px;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
  </style>
</head>
<body>
  <main class="login-shell">
    <div class="brand-row">
      <div class="brand-left">
        <div class="logo-pill">Z</div>
        <div>
          <div class="brand-name">Zaraz Admin Panel</div>
          <div class="brand-sub">Administrator Portal</div>
        </div>
      </div>
      <span class="vault-badge">🔐 LOGIN ONLY</span>
    </div>

    <h1 class="heading">Admin Panel Login</h1>
    <p class="subheading">
      Enter your Administrator Account ID and Password.
      Self sign-up &amp; registration are disabled.
    </p>

    <div id="errorBanner" class="error-banner" role="alert">
      <span>⚠️</span>
      <span id="errorText">${safeError}</span>
    </div>

    <form id="serverLoginForm" method="POST" action="/login">
      <input type="hidden" name="redirect" id="redirectInput" value="${safeRedirect}" />

      <div class="form-group">
        <label for="identifier">Account ID / Username / Email</label>
        <div class="input-wrap">
          <input
            type="text"
            id="identifier"
            name="identifier"
            class="form-control"
            placeholder="Enter Administrator ID / Username"
            autocomplete="username"
            required
            autofocus
          />
        </div>
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <div class="input-wrap">
          <input
            type="password"
            id="password"
            name="password"
            class="form-control"
            placeholder="Enter password"
            autocomplete="current-password"
            style="padding-right: 4.5rem;"
            required
          />
          <button type="button" class="toggle-pass" onclick="togglePassword()" id="toggleBtn">
            SHOW
          </button>
        </div>
      </div>

      <button type="submit" class="btn-login" id="submitBtn">
        <span>Authenticate &amp; Open Server</span>
        <span>&rarr;</span>
      </button>
    </form>

    <div class="security-footer">
      <div class="security-row">
        <span>Authentication Vault</span>
        <span class="mono-pill">${SERVER_ACC_DB_NAME}.${SERVER_ACC_COLLECTION}</span>
      </div>
      <div class="security-row">
        <span>Sign-Up / Register / Social</span>
        <span style="color: #f87171; font-weight: 700;">● Disabled (MongoDB Only)</span>
      </div>
    </div>
  </main>

  <script>
    function togglePassword() {
      var input = document.getElementById('password');
      var btn = document.getElementById('toggleBtn');
      if (input.type === 'password') {
        input.type = 'text';
        btn.innerText = 'HIDE';
      } else {
        input.type = 'password';
        btn.innerText = 'SHOW';
      }
    }

    document.getElementById('serverLoginForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var btn = document.getElementById('submitBtn');
      var errBox = document.getElementById('errorBanner');
      var errText = document.getElementById('errorText');

      errBox.style.display = 'none';
      btn.disabled = true;
      btn.innerHTML = '<span>Verifying MongoDB Credentials...</span>';

      try {
        var res = await fetch('/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            identifier: document.getElementById('identifier').value,
            password: document.getElementById('password').value,
            redirect: document.getElementById('redirectInput').value
          })
        });

        var data = await res.json();
        if (res.ok && data.success) {
          btn.innerHTML = '<span>✓ Access Granted! Redirecting...</span>';
          window.location.href = data.redirectUrl || '/';
          return;
        }

        errText.innerText = data.message || 'Invalid ID or Password.';
        errBox.style.display = 'flex';
      } catch (err) {
        errText.innerText = err.message || 'Network error verifying credentials.';
        errBox.style.display = 'flex';
      } finally {
        if (!btn.innerHTML.includes('Granted')) {
          btn.disabled = false;
          btn.innerHTML = '<span>Authenticate &amp; Open Server</span><span>&rarr;</span>';
        }
      }
    });
  </script>
</body>
</html>`;
};

/**
 * GET /login (and /server-login, /server-acc/login)
 * Renders the Login-Only UI. If already authenticated, redirects to dashboard.
 */
export const renderServerLoginPage = (req, res) => {
  const redirectTarget = getSafeRedirectTarget(req.query.redirect);

  if (req.serverAccount) {
    return res.redirect(redirectTarget);
  }

  return res
    .status(200)
    .send(buildLoginPageHtml({ redirectTarget }));
};

/**
 * POST /login (and /server-login, /server-acc/login)
 * Authenticates strictly against MongoDB SERVER_ACC.accounts.
 */
export const serverLogin = async (req, res) => {
  const wantsHtml = isHtmlRequest(req);
  const redirectTarget = getSafeRedirectTarget(
    req.body?.redirect || req.query?.redirect
  );
  const clientIp =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Device';

  try {
    const rawIdentifier =
      req.body?.identifier ??
      req.body?.id ??
      req.body?.accountId ??
      req.body?.userId ??
      req.body?.adminId ??
      req.body?.username ??
      req.body?.email;

    const enteredPassword = req.body?.password ?? req.body?.pass;

    if (!rawIdentifier || !enteredPassword) {
      if (rawIdentifier) {
        await recordServerLoginLog({
          accountId: String(rawIdentifier),
          name: 'Unknown Operator',
          type: 'VIEWER',
          ip: clientIp,
          userAgent,
          status: 'FAILED',
          failureReason: 'Missing password entered',
        });
      }
      const msg = 'Account ID and Password are required.';
      if (wantsHtml) {
        return res
          .status(400)
          .send(buildLoginPageHtml({ redirectTarget, errorMessage: msg }));
      }
      return res.status(400).json({ success: false, message: msg });
    }

    const accountDoc = await findServerAccountByIdentifier(String(rawIdentifier));
    if (!accountDoc) {
      await recordServerLoginLog({
        accountId: String(rawIdentifier),
        name: 'Unknown Operator',
        type: 'VIEWER',
        ip: clientIp,
        userAgent,
        status: 'FAILED',
        failureReason: `Account ID not found in MongoDB ${SERVER_ACC_DB_NAME}.${SERVER_ACC_COLLECTION}`,
      });
      const msg = `Invalid credentials. Account not found in MongoDB ${SERVER_ACC_DB_NAME}.${SERVER_ACC_COLLECTION}.`;
      if (wantsHtml) {
        return res
          .status(401)
          .send(buildLoginPageHtml({ redirectTarget, errorMessage: msg }));
      }
      return res.status(401).json({ success: false, message: msg });
    }

    const normalizedType = normalizeServerAccType(accountDoc.type || accountDoc.role);

    if (accountDoc.isActive === false) {
      await recordServerLoginLog({
        accountId: String(rawIdentifier),
        name: accountDoc.name || String(rawIdentifier),
        type: normalizedType,
        ip: clientIp,
        userAgent,
        status: 'FAILED',
        failureReason: 'Account is disabled in MongoDB',
      });
      const msg = 'This SERVER_ACC account is disabled in MongoDB.';
      if (wantsHtml) {
        return res
          .status(403)
          .send(buildLoginPageHtml({ redirectTarget, errorMessage: msg }));
      }
      return res.status(403).json({ success: false, message: msg });
    }

    const validPassword = await verifyAccountPassword(
      accountDoc,
      String(enteredPassword)
    );
    if (!validPassword) {
      await recordServerLoginLog({
        accountId: String(rawIdentifier),
        name: accountDoc.name || String(rawIdentifier),
        type: normalizedType,
        ip: clientIp,
        userAgent,
        status: 'FAILED',
        failureReason: 'Incorrect password entered',
      });
      const msg = 'Invalid credentials. Incorrect password.';
      if (wantsHtml) {
        return res
          .status(401)
          .send(buildLoginPageHtml({ redirectTarget, errorMessage: msg }));
      }
      return res.status(401).json({ success: false, message: msg });
    }

    await touchServerAccountLogin(accountDoc._id).catch(() => {});

    const account = sanitizeServerAccount(accountDoc);
    const token = signServerAccToken(account);
    setServerAuthCookie(req, res, token);

    await recordServerLoginLog({
      accountId: account.id,
      name: account.name,
      type: account.type,
      ip: clientIp,
      userAgent,
      status: 'SUCCESS',
      failureReason: '',
    });

    if (wantsHtml) {
      return res.redirect(redirectTarget);
    }

    return res.status(200).json({
      success: true,
      message: `Authenticated via MongoDB ${SERVER_ACC_DB_NAME}.${SERVER_ACC_COLLECTION}.`,
      redirectUrl: redirectTarget,
      token,
      account,
    });
  } catch (error) {
    console.error('[SERVER_ACC Login Error]:', error.message);
    const msg = 'Authentication service error while checking MongoDB SERVER_ACC.';
    if (wantsHtml) {
      return res
        .status(500)
        .send(buildLoginPageHtml({ redirectTarget, errorMessage: msg }));
    }
    return res.status(500).json({
      success: false,
      message: msg,
      error: error.message,
    });
  }
};

/**
 * GET /logout & POST /logout
 * Clears SERVER_ACC cookie and redirects to login portal.
 */
export const serverLogout = (req, res) => {
  res.clearCookie(SERVER_ACC_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttpsRequest(req),
    path: '/',
  });

  if (isHtmlRequest(req)) {
    return res.redirect('/login');
  }

  return res.status(200).json({
    success: true,
    message: 'Logged out of Zaraz Server Dashboard.',
    redirectUrl: '/login',
  });
};

/**
 * GET /server-acc/me & GET /server-acc/status
 */
export const getServerMe = (req, res) => {
  return res.status(200).json({
    success: true,
    authenticated: true,
    vault: `${SERVER_ACC_DB_NAME}.${SERVER_ACC_COLLECTION}`,
    account: req.serverAccount,
  });
};

/**
 * Explicitly blocks Admin Panel self sign-up / registration.
 * Accounts can ONLY be created directly by administrators or database management.
 */
export const blockServerRegistration = (req, res) => {
  const msg = `Sign-up & self-registration are disabled on Zaraz Admin Panel. Contact your System Administrator for access.`;

  if (isHtmlRequest(req)) {
    return res.status(403).send(
      buildLoginPageHtml({
        redirectTarget: '/',
        errorMessage: msg,
      })
    );
  }

  return res.status(403).json({
    success: false,
    message: msg,
    registrationAllowed: false,
  });
};

/**
 * GET /server-logs & GET /server-acc/logs & GET /api/server-logs
 * Dedicated Audit Log Component for Server Operator Logins.
 * STRICTLY RESTRICTED TO ADMIN OPERATORS ONLY.
 */
export const renderServerLoginLogsPage = async (req, res) => {
  const operator = req.serverAccount;
  const isAdmin = operator && operator.type === 'ADMIN';
  const wantsHtml = isHtmlRequest(req);

  // 1. Enforce strict Admin-only access
  if (!isAdmin) {
    if (wantsHtml) {
      const accessDeniedContent = `
        <div style="max-width: 680px; margin: 3rem auto; text-align: center; background: #0c1524; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 22px; padding: 3rem 2rem; box-shadow: 0 24px 70px rgba(0, 0, 0, 0.65), 0 0 40px rgba(239, 68, 68, 0.15);">
          <div style="width: 64px; height: 64px; border-radius: 18px; background: rgba(239, 68, 68, 0.16); border: 1px solid rgba(239, 68, 68, 0.45); display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1.25rem auto;">
            🛡️
          </div>
          <span class="badge-pill" style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); font-weight: 800; font-size: 0.72rem; text-transform: uppercase; margin-bottom: 0.75rem;">
            HTTP 403 • RESTRICTED ACCESS
          </span>
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 0.65rem;">
            ADMIN Clearance Required
          </h2>
          <p style="color: var(--text-muted); font-size: 0.88rem; max-width: 480px; margin: 0 auto 1.5rem auto; line-height: 1.6;">
            Server Operator Login Audit Logs are strictly restricted to <strong>ADMIN</strong> clearance.
            Your active operator type is <strong style="color: #38bdf8;">${operator?.type || 'VIEWER'}</strong>.
          </p>

          <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid var(--border-card); border-radius: 14px; padding: 1.25rem; max-width: 460px; margin: 0 auto 1.75rem auto; text-align: left; font-size: 0.82rem;">
            <div style="color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; font-weight: 700; margin-bottom: 0.6rem; letter-spacing: 0.05em;">
              Role Access &amp; Privileges Breakdown
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <span style="font-weight: 700; color: #f87171;">ADMIN:</span>
              <span style="color: #34d399; font-size: 0.78rem; font-weight: 700;">✓ Audit Logs &amp; User Deletion</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <span style="font-weight: 700; color: #38bdf8;">EDITOR:</span>
              <span style="color: #94a3b8; font-size: 0.78rem;">Catalog &amp; Orders (Logs Restricted 🔒)</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <span style="font-weight: 700; color: #c084fc;">MODERATOR:</span>
              <span style="color: #94a3b8; font-size: 0.78rem;">Order Review (Logs Restricted 🔒)</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <span style="font-weight: 700; color: #fbbf24;">WORKER:</span>
              <span style="color: #94a3b8; font-size: 0.78rem;">Logistics Fulfillment (Logs Restricted 🔒)</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0;">
              <span style="font-weight: 700; color: #94a3b8;">VIEWER:</span>
              <span style="color: #94a3b8; font-size: 0.78rem;">Read-Only Metrics (Logs Restricted 🔒)</span>
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem; justify-content: center;">
            <a href="/" class="btn btn-emerald btn-sm">← Return to Dashboard</a>
            <a href="/auth" class="btn btn-secondary btn-sm">Users Directory</a>
          </div>
        </div>
      `;

      return res.status(403).send(
        renderBaseLayout({
          title: 'Access Denied • Login Audit Logs',
          activeNav: 'server-logs',
          serverAccount: operator,
          content: accessDeniedContent,
        })
      );
    }

    return res.status(403).json({
      success: false,
      message: `Access Denied: Only ADMIN administrators can access Admin Panel login audit logs. Your current role is ${operator?.type || 'UNAUTHENTICATED'}.`,
    });
  }

  // 2. Admin clearance confirmed: fetch audit logs from separate SERVER_ACC.login_logs collection
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const logData = await getServerLoginLogs({ limit, page });
    const logs = logData.logs || [];

    // Calculate security metrics
    const totalLogins = logData.total || logs.length;
    const successCount = logs.filter((l) => l.status === 'SUCCESS').length;
    const failedCount = logs.filter((l) => l.status === 'FAILED').length;
    const uniqueOperators = new Set(logs.map((l) => l.accountId)).size;

    const roleCounts = {
      ADMIN: logs.filter((l) => normalizeServerAccType(l.type) === 'ADMIN').length,
      EDITOR: logs.filter((l) => normalizeServerAccType(l.type) === 'EDITOR').length,
      MODERATOR: logs.filter((l) => normalizeServerAccType(l.type) === 'MODERATOR').length,
      WORKER: logs.filter((l) => normalizeServerAccType(l.type) === 'WORKER').length,
      VIEWER: logs.filter((l) => normalizeServerAccType(l.type) === 'VIEWER').length,
    };

    if (!wantsHtml) {
      return res.status(200).json({
        success: true,
        service: 'Zaraz Server Authentication Audit Trail',
        database: 'SERVER_ACC',
        collection: 'login_logs',
        operator: operator.name || operator.id,
        operatorType: operator.type,
        stats: {
          total: totalLogins,
          success: successCount,
          failed: failedCount,
          uniqueOperators,
          byRole: roleCounts,
        },
        pagination: {
          page: logData.page,
          limit: logData.limit,
          totalPages: logData.totalPages,
        },
        logs,
      });
    }

    const roleStyleMap = {
      ADMIN: 'background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.35);',
      EDITOR: 'background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35);',
      MODERATOR: 'background: rgba(192, 132, 252, 0.15); color: #c084fc; border: 1px solid rgba(192, 132, 252, 0.35);',
      WORKER: 'background: rgba(251, 191, 36, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.35);',
      VIEWER: 'background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.35);',
    };

    const logRows = logs.length === 0
      ? `<tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">No login events recorded in SERVER_ACC.login_logs yet.</td></tr>`
      : logs
          .map((item) => {
            const isSuccess = item.status === 'SUCCESS';
            const statusStyle = isSuccess
              ? 'background: rgba(16, 185, 129, 0.18); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4);'
              : 'background: rgba(239, 68, 68, 0.18); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4);';
            const itemType = normalizeServerAccType(item.type);
            const roleStyle = roleStyleMap[itemType] || roleStyleMap.VIEWER;
            const logDate = item.loggedAt ? new Date(item.loggedAt) : new Date();

            return `
            <tr class="log-row" data-status="${item.status}" data-type="${itemType}" data-operator="${escapeHtml(item.accountId)} ${escapeHtml(item.name)} ${escapeHtml(item.ip)}">
              <td>
                <div style="font-weight: 700; color: #fff;">${escapeHtml(item.name || item.accountId)}</div>
                <div style="font-size: 0.72rem; color: var(--muted); font-family: 'JetBrains Mono', monospace;">id: ${escapeHtml(item.accountId)}</div>
              </td>
              <td>
                <span class="badge-pill" style="${roleStyle} font-weight: 800; letter-spacing: 0.04em;">
                  ${escapeHtml(itemType)}
                </span>
              </td>
              <td>
                <span class="badge-pill" style="${statusStyle} font-weight: 800;">
                  ${isSuccess ? '✓ SUCCESS' : '✗ FAILED'}
                </span>
                ${item.failureReason ? `<div style="font-size: 0.7rem; color: #f87171; margin-top: 0.25rem;">${escapeHtml(item.failureReason)}</div>` : ''}
              </td>
              <td>
                <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; color: #cbd5e1; background: rgba(0,0,0,0.3); padding: 0.15rem 0.45rem; border-radius: 4px; border: 1px solid rgba(255,255,255,0.06);">
                  ${escapeHtml(item.ip || '127.0.0.1')}
                </span>
              </td>
              <td>
                <div style="font-size: 0.72rem; color: var(--muted); max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(item.userAgent || '')}">
                  ${escapeHtml(item.userAgent || 'Unknown Device')}
                </div>
              </td>
              <td style="text-align: right; font-family: 'JetBrains Mono', monospace; font-size: 0.74rem; color: #cbd5e1;">
                <div>${logDate.toLocaleDateString()} ${logDate.toLocaleTimeString()}</div>
              </td>
            </tr>`;
          })
          .join('');

    const htmlContent = `
      <div class="page-header">
        <div class="page-title">
          <h2>🛡️ Administrator Login Audit Logs</h2>
          <p>Administrator Login Audit &amp; Security Collection (<code>server_login_logs</code>)</p>
        </div>
        <div style="display: flex; gap: 0.6rem; align-items: center;">
          <span class="badge-pill" style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); font-weight: 800;">
            ADMIN CLEARANCE ACTIVE
          </span>
          <a href="/server-logs?format=json" target="_blank" class="btn btn-secondary btn-sm">📄 Raw JSON</a>
        </div>
      </div>

      <!-- Metrics Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
        <div class="card" style="padding: 1.25rem;">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--muted); text-transform: uppercase;">Total Login Events</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: #fff; margin-top: 0.25rem;">${totalLogins}</div>
          <div style="font-size: 0.72rem; color: #34d399; margin-top: 0.2rem;">In server_login_logs</div>
        </div>
        <div class="card" style="padding: 1.25rem;">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--muted); text-transform: uppercase;">Successful Logins</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: #34d399; margin-top: 0.25rem;">${successCount}</div>
          <div style="font-size: 0.72rem; color: var(--muted); margin-top: 0.2rem;">Authenticated Sessions</div>
        </div>
        <div class="card" style="padding: 1.25rem;">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--muted); text-transform: uppercase;">Failed Attempts</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: #f87171; margin-top: 0.25rem;">${failedCount}</div>
          <div style="font-size: 0.72rem; color: var(--muted); margin-top: 0.2rem;">Blocked Credential Inputs</div>
        </div>
        <div class="card" style="padding: 1.25rem;">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--muted); text-transform: uppercase;">Unique Administrators</div>
          <div style="font-size: 1.8rem; font-weight: 800; color: #38bdf8; margin-top: 0.25rem;">${uniqueOperators}</div>
          <div style="font-size: 0.72rem; color: var(--muted); margin-top: 0.2rem;">Distinct Administrator IDs</div>
        </div>
      </div>

      <!-- Role Distribution Matrix -->
      <div class="card" style="margin-bottom: 1.75rem; padding: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 0.85rem;">
          <div>
            <h4 style="font-size: 0.95rem; font-weight: 800; color: #fff;">Administrator Role Distribution</h4>
            <p style="font-size: 0.75rem; color: var(--muted);">Logins segmented across the 5 administrator roles</p>
          </div>
          <div style="font-size: 0.72rem; color: #34d399; font-family: 'JetBrains Mono', monospace;">
            Vault: server_login_logs
          </div>
        </div>
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <div class="badge-pill" style="${roleStyleMap.ADMIN} padding: 0.4rem 0.85rem;">
            <span>ADMIN:</span> <strong>${roleCounts.ADMIN}</strong>
          </div>
          <div class="badge-pill" style="${roleStyleMap.EDITOR} padding: 0.4rem 0.85rem;">
            <span>EDITOR:</span> <strong>${roleCounts.EDITOR}</strong>
          </div>
          <div class="badge-pill" style="${roleStyleMap.MODERATOR} padding: 0.4rem 0.85rem;">
            <span>MODERATOR:</span> <strong>${roleCounts.MODERATOR}</strong>
          </div>
          <div class="badge-pill" style="${roleStyleMap.WORKER} padding: 0.4rem 0.85rem;">
            <span>WORKER:</span> <strong>${roleCounts.WORKER}</strong>
          </div>
          <div class="badge-pill" style="${roleStyleMap.VIEWER} padding: 0.4rem 0.85rem;">
            <span>VIEWER:</span> <strong>${roleCounts.VIEWER}</strong>
          </div>
        </div>
      </div>

      <!-- Filter & Search Toolbar -->
      <div class="card" style="margin-bottom: 1.5rem; padding: 1rem 1.25rem;">
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Status:</span>
            <button type="button" class="btn btn-secondary btn-sm filter-status-btn active" data-filter="all" onclick="filterByStatus('all', this)">All</button>
            <button type="button" class="btn btn-secondary btn-sm filter-status-btn" data-filter="SUCCESS" onclick="filterByStatus('SUCCESS', this)">✓ Success</button>
            <button type="button" class="btn btn-secondary btn-sm filter-status-btn" data-filter="FAILED" onclick="filterByStatus('FAILED', this)">✗ Failed</button>
          </div>

          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Type:</span>
            <button type="button" class="btn btn-secondary btn-sm filter-type-btn active" data-type="all" onclick="filterByType('all', this)">All</button>
            <button type="button" class="btn btn-secondary btn-sm filter-type-btn" data-type="ADMIN" onclick="filterByType('ADMIN', this)">Admin</button>
            <button type="button" class="btn btn-secondary btn-sm filter-type-btn" data-type="EDITOR" onclick="filterByType('EDITOR', this)">Editor</button>
            <button type="button" class="btn btn-secondary btn-sm filter-type-btn" data-type="MODERATOR" onclick="filterByType('MODERATOR', this)">Mod</button>
            <button type="button" class="btn btn-secondary btn-sm filter-type-btn" data-type="WORKER" onclick="filterByType('WORKER', this)">Worker</button>
            <button type="button" class="btn btn-secondary btn-sm filter-type-btn" data-type="VIEWER" onclick="filterByType('VIEWER', this)">Viewer</button>
          </div>

          <div style="flex: 1; min-width: 220px; max-width: 340px;">
            <input type="text" id="logSearchInput" placeholder="Search by operator ID, name, or IP..." class="form-control" onkeyup="filterBySearch()" />
          </div>
        </div>
      </div>

      <!-- Logs Table -->
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Operator ID &amp; Name</th>
              <th>Account Type</th>
              <th>Auth Status &amp; Reason</th>
              <th>Client IP Address</th>
              <th>Device &amp; User Agent</th>
              <th style="text-align: right;">Timestamp</th>
            </tr>
          </thead>
          <tbody id="logsTableBody">
            ${logRows}
          </tbody>
        </table>
      </div>
    `;

    const extraScripts = `
      <script>
        var currentStatusFilter = 'all';
        var currentTypeFilter = 'all';

        function applyFilters() {
          var searchVal = (document.getElementById('logSearchInput').value || '').toLowerCase().trim();
          var rows = document.querySelectorAll('.log-row');

          rows.forEach(function(row) {
            var status = row.getAttribute('data-status') || '';
            var type = row.getAttribute('data-type') || '';
            var opText = (row.getAttribute('data-operator') || '').toLowerCase();

            var matchesStatus = (currentStatusFilter === 'all') || (status === currentStatusFilter);
            var matchesType = (currentTypeFilter === 'all') || (type === currentTypeFilter);
            var matchesSearch = !searchVal || opText.indexOf(searchVal) !== -1;

            if (matchesStatus && matchesType && matchesSearch) {
              row.style.display = '';
            } else {
              row.style.display = 'none';
            }
          });
        }

        function filterByStatus(status, btn) {
          currentStatusFilter = status;
          document.querySelectorAll('.filter-status-btn').forEach(function(b) {
            b.classList.remove('btn-emerald');
            b.classList.add('btn-secondary');
          });
          btn.classList.remove('btn-secondary');
          btn.classList.add('btn-emerald');
          applyFilters();
        }

        function filterByType(type, btn) {
          currentTypeFilter = type;
          document.querySelectorAll('.filter-type-btn').forEach(function(b) {
            b.classList.remove('btn-emerald');
            b.classList.add('btn-secondary');
          });
          btn.classList.remove('btn-secondary');
          btn.classList.add('btn-emerald');
          applyFilters();
        }

        function filterBySearch() {
          applyFilters();
        }
      </script>
    `;

    return res.status(200).send(
      renderBaseLayout({
        title: 'Administrator Login Audit Logs',
        activeNav: 'server-logs',
        serverAccount: operator,
        jsonUrl: '/server-logs?format=json',
        content: htmlContent,
        extraScripts,
      })
    );
  } catch (error) {
    console.error('[renderServerLoginLogsPage Error]:', error.message);
    if (!wantsHtml) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve login audit logs from SERVER_ACC.login_logs.',
        error: error.message,
      });
    }
    return res.status(500).send(
      renderBaseLayout({
        title: 'Error • Audit Logs',
        activeNav: 'server-logs',
        serverAccount: operator,
        content: `<div style="padding: 2rem; color: #f87171;">Failed to load audit logs: ${escapeHtml(error.message)}</div>`,
      })
    );
  }
};
