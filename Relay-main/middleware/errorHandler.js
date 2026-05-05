const logger = require('../utils/logger');

/**
 * Centralized error handler.
 * Must be registered LAST in the middleware chain.
 */
const errorHandler = (err, req, res, next) => {
  // Log all errors
  logger.error('Unhandled error', {
    message: err.message,
    stack:   err.stack,
    path:    req.path,
    method:  req.method,
    user:    req.user?._id,
    ip:      req.ip,
  });

  // Supabase / Postgres error mapping
  if (err.code && typeof err.code === 'string' && err.code.length === 5) {
    // Unique violation
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'Record already exists', detail: err.detail });
    }
    // Foreign key violation
    if (err.code === '23503') {
      return res.status(400).json({ success: false, message: 'Reference error: related record not found' });
    }
    // Invalid UUID / type
    if (err.code === '22P02') {
      return res.status(400).json({ success: false, message: 'Invalid data format (ID or UUID)' });
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large (max 5MB)' });
  }

  // Default: internal server error
  const statusCode = err.status || err.statusCode || 500;
  const message    = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    traceId: req.context?.traceId,
    // Include error code in dev for easier debugging
    code: process.env.NODE_ENV !== 'production' ? err.code : undefined
  });
};

/** 404 handler — register before errorHandler */
const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
};

module.exports = { errorHandler, notFoundHandler };
