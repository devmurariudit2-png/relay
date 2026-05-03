const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authService = require('../services/authService');
const R = require('../utils/response');
const logger = require('../utils/logger');

/** Verify JWT and attach req.user */
const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return R.unauthorized(res, 'No token provided');

  const token = auth.split(' ')[1];
  if (authService.isTokenRevoked(token))
    return R.unauthorized(res, 'Token revoked. Please log in again');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) return R.unauthorized(res, 'User not found');
    if (!user.active) return R.unauthorized(res, 'Account is deactivated');

    req.user = user;
    next();
  } catch (err) {
    logger.warn('Invalid JWT', { error: err.message, ip: req.ip });
    return R.unauthorized(res, 'Invalid or expired token');
  }
};

/** Require admin role */
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return R.forbidden(res, 'Admin access required');
  next();
};

/** Require admin or member role (viewers are read-only) */
const memberOrAdmin = (req, res, next) => {
  if (!['admin', 'member'].includes(req.user?.role))
    return R.forbidden(res, 'Write access requires member or admin role');
  next();
};

module.exports = { protect, adminOnly, memberOrAdmin };
