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
} from '../controllers/authController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

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

export default router;
