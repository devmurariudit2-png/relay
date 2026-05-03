const { body, param, query, validationResult } = require('express-validator');
const R = require('../utils/response');

/** Run after validators — returns 400 if any errors */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return R.badRequest(res, 'Validation failed', errors.array().map(e => ({ field: e.path, message: e.msg })));
  }
  next();
};

// ── Auth validators ──────────────────────────────────────────────────────────
const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

const registerRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 chars'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6, max: 128 }).withMessage('Password must be at least 6 chars'),
];

const profileRules = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 chars'),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'AED', 'SGD', 'INR', 'ZAR', 'CAD', 'AUD']).withMessage('Unsupported currency'),
];

const passwordRules = [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6, max: 128 }).withMessage('New password must be at least 6 chars'),
];

// ── Transaction validators ───────────────────────────────────────────────────
const transactionRules = [
  body('date').isISO8601().toDate().withMessage('Valid ISO date required (YYYY-MM-DD)'),
  body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description required (max 500 chars)'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('source').isIn(['bank', 'internal']).withMessage('Source must be bank or internal'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3-letter ISO code'),
  body('reference').optional({ nullable: true }).isLength({ max: 200 }).withMessage('Reference max 200 chars'),
  body('category').optional({ nullable: true }).isLength({ max: 100 }).withMessage('Category max 100 chars'),
  body('note').optional({ nullable: true }).isLength({ max: 1000 }).withMessage('Note max 1000 chars'),
];

const transactionPatchRules = [
  body('category').optional({ nullable: true }).isLength({ max: 100 }).withMessage('Category max 100 chars'),
  body('note').optional({ nullable: true }).isLength({ max: 1000 }).withMessage('Note max 1000 chars'),
];

// ── Ticket validators ────────────────────────────────────────────────────────
const ticketRules = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 chars'),
  body('description').trim().isLength({ min: 10, max: 5000 }).withMessage('Description must be 10–5000 chars'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('category').optional().isIn(['bug', 'feature', 'billing', 'access', 'other']).withMessage('Invalid category'),
];

const ticketPatchRules = [
  body('status').optional().isIn(['open', 'in-progress', 'resolved', 'closed']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('comment').optional().trim().isLength({ min: 1, max: 2000 }).withMessage('Comment must be 1–2000 chars'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo ID'),
];

// ── Team validators ──────────────────────────────────────────────────────────
const inviteRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('role').optional().isIn(['admin', 'member', 'viewer']).withMessage('Role must be admin, member or viewer'),
];

const roleUpdateRules = [
  body('role').isIn(['admin', 'member', 'viewer']).withMessage('Role must be admin, member or viewer'),
];

// ── Param validators ─────────────────────────────────────────────────────────
const mongoIdParam = (field = 'id') => param(field).isMongoId().withMessage(`${field} must be a valid MongoDB ID`);

// ── Query validators ─────────────────────────────────────────────────────────
const paginationQuery = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be 1–100'),
];

module.exports = {
  validate,
  loginRules, registerRules, profileRules, passwordRules,
  transactionRules, transactionPatchRules,
  ticketRules, ticketPatchRules,
  inviteRules, roleUpdateRules,
  mongoIdParam, paginationQuery,
};
