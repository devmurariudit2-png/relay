const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const logger     = require('../utils/logger');

// ── Helmet — sets secure HTTP headers ────────────────────────────────────────
const helmetConfig = helmet({
  contentSecurityPolicy: false, // Let frontend handle CSP
  crossOriginEmbedderPolicy: false,
});

// ── Rate limiters ─────────────────────────────────────────────────────────────

/** General API limiter — 200 req / 15 min per IP */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit hit', { ip: req.ip, path: req.path });
    res.status(options.statusCode).json(options.message);
  },
});

/** Strict auth limiter — 20 req / 15 min per IP (prevents brute-force) */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  handler: (req, res, next, options) => {
    logger.warn('Auth rate limit hit', { ip: req.ip, email: req.body?.email });
    res.status(options.statusCode).json(options.message);
  },
});

/** Import limiter — 10 req / 15 min per user (large operations) */
const importLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { success: false, message: 'Too many import requests, please wait before importing again.' },
});

module.exports = { helmetConfig, apiLimiter, authLimiter, importLimiter };
