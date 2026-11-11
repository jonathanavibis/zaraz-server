import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const verifyToken = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token && req.serverAccount) {
    req.user = {
      _id: req.serverAccount._id,
      id: req.serverAccount.id,
      name: req.serverAccount.name,
      role: 'admin',
      isServerAccount: true,
    };
    return next();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied: No authentication token provided. Please log in.',
    });
  }

  try {
    const secret =
      process.env.JWT_SECRET || 'zaraz_super_secret_jwt_key_2026_green_black';
    const decoded = jwt.verify(token, secret);

    const userId = decoded.id || decoded._id;
    let user = null;

    if (userId) {
      user = await User.findById(userId).select('-password');
    }

    if (!user && decoded.email) {
      user = await User.findOne({ email: decoded.email.toLowerCase() }).select('-password');
    }

    if (!user) {
      // If user record is not found in DB but token is valid (e.g. social session), supply decoded payload
      req.user = {
        _id: decoded.id,
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        image: decoded.image,
        role: decoded.role || 'customer',
      };
      return next();
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.',
      error: err.message,
    });
  }
};

export const verifyAdmin = (req, res, next) => {
  const role = req.user?.role?.toLowerCase();
  if (req.serverAccount || (req.user && role === 'admin')) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden: Administrator privileges required.',
    });
  }
};

export const verifySellerOrAdmin = (req, res, next) => {
  const role = req.user?.role?.toLowerCase();
  if (req.serverAccount || (req.user && (role === 'admin' || role === 'seller'))) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden: Seller or Administrator privileges required.',
    });
  }
};
