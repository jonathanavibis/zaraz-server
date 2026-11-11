import express from 'express';
import {
  renderServerLoginPage,
  serverLogin,
  serverLogout,
  getServerMe,
  blockServerRegistration,
} from './serverAuthController.js';
import { requireServerAdminSession } from './serverAuthMiddleware.js';

const router = express.Router();

// Login-Only Gateway (NO Sign-Up / Register / Social OAuth)
router.get(['/login', '/server-login', '/server-acc/login'], renderServerLoginPage);
router.post(['/login', '/server-login', '/server-acc/login'], serverLogin);

// Logout / Lock Dashboard
router.get(['/logout', '/server-acc/logout'], serverLogout);
router.post(['/logout', '/server-acc/logout'], serverLogout);

// Current SERVER_ACC Authenticated Session Info
router.get(
  ['/server-acc/me', '/server-acc/status'],
  requireServerAdminSession,
  getServerMe
);

// Explicitly block backend registration / sign-up endpoints
router.all(
  ['/register', '/signup', '/server-acc/register', '/server-acc/signup'],
  blockServerRegistration
);

export default router;
