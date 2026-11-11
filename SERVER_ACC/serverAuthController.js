import jwt from 'jsonwebtoken';
import {
  findServerAccountByIdentifier,
  verifyAccountPassword,
  touchServerAccountLogin,
  sanitizeServerAccount,
} from './ServerAccount.js';
import {
  SERVER_ACC_COOKIE_NAME,
  getServerAccJwtSecret,
  getSafeRedirectTarget,
} from './serverAuthMiddleware.js';
import { SERVER_ACC_DB_NAME, SERVER_ACC_COLLECTION } from './serverAccDb.js';
import { isHtmlRequest } from '../utils/viewRenderer.js';

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
      role: account.role,
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
  <title>Server Login • Zaraz Core Engine</title>
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
          <div class="brand-name">Zaraz Server Core</div>
          <div class="brand-sub">${SERVER_ACC_DB_NAME}.${SERVER_ACC_COLLECTION}</div>
        </div>
      </div>
      <span class="vault-badge">🔐 LOGIN ONLY</span>
    </div>

    <h1 class="heading">Backend Access Login</h1>
    <p class="subheading">
      Enter your server Account ID and Password configured in MongoDB
      <code style="color:#34d399; font-family:'JetBrains Mono', monospace;">${SERVER_ACC_DB_NAME}</code>.
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
            placeholder="Enter MongoDB SERVER_ACC ID"
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
      const msg = `Invalid credentials. Account not found in MongoDB ${SERVER_ACC_DB_NAME}.${SERVER_ACC_COLLECTION}.`;
      if (wantsHtml) {
        return res
          .status(401)
          .send(buildLoginPageHtml({ redirectTarget, errorMessage: msg }));
      }
      return res.status(401).json({ success: false, message: msg });
    }

    if (accountDoc.isActive === false) {
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
 * Explicitly blocks backend self sign-up / registration.
 * Accounts can ONLY be created directly inside MongoDB SERVER_ACC.accounts.
 */
export const blockServerRegistration = (req, res) => {
  const msg = `Sign-up & self-registration are disabled on Zaraz Backend. Create server credentials directly in MongoDB (${SERVER_ACC_DB_NAME}.${SERVER_ACC_COLLECTION}).`;

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
