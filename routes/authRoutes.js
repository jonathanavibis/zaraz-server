import express from 'express';
import {
  registerUser,
  loginUser,
  socialAuth,
  issueJwt,
  getCurrentUser,
  getProfile,
  updateProfile,
  getAllUsers,
  getUserStats,
  getAuthOverview,
  deleteUser,
} from '../controllers/authController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// Auth Component Overview (Component UI for browser, JSON for API)
router.get('/', getAuthOverview);

// Public Authentication endpoints
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/social', socialAuth);
router.post('/jwt', issueJwt);
router.get('/stats', getUserStats);

// Protected Profile endpoints (Requires JWT Bearer token)
router.get('/me', verifyToken, getCurrentUser);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);

// Admin-only User Management
router.get('/users', verifyToken, verifyAdmin, getAllUsers);
router.delete(['/users/:id', '/user/:id'], deleteUser);

export default router;
