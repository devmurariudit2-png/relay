const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const audit = require('../middleware/audit');
const R = require('../utils/response');
const adminService = require('../services/adminService');
const { mongoIdParam, paginationQuery, validate } = require('../middleware/validate');
const { query, body } = require('express-validator');

router.use(protect, adminOnly);

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users',
  paginationQuery,
  [
    query('role').optional().isIn(['admin','member','viewer']),
    query('active').optional().isIn(['true','false']),
    query('search').optional().isString().isLength({ max: 200 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await adminService.listUsers(req.query);
      return R.paginated(res, result.users, { page: result.page, limit: result.limit, total: result.total });
    } catch (err) { next(err); }
  }
);

router.get('/users/:id',
  mongoIdParam(), validate,
  async (req, res, next) => {
    try {
      const user = await adminService.getUserDetails(req.params.id);
      return R.success(res, user);
    } catch (err) { next(err); }
  }
);

router.patch('/users/:id',
  mongoIdParam(),
  [
    body('role').optional().isIn(['admin','member','viewer']).withMessage('Invalid role'),
    body('active').optional().isBoolean().withMessage('active must be boolean'),
  ],
  validate,
  audit('ADMIN_UPDATE', 'User'),
  async (req, res, next) => {
    try {
      const user = await adminService.updateUser(req.params.id, req.body);
      return R.success(res, user);
    } catch (err) { next(err); }
  }
);

router.delete('/users/:id',
  mongoIdParam(), validate,
  audit('DELETE', 'User'),
  async (req, res, next) => {
    try {
      const result = await adminService.deleteUser(req.params.id, req.user._id);
      return R.success(res, result);
    } catch (err) { next(err); }
  }
);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics', async (req, res, next) => {
  try {
    const result = await adminService.analytics();
    return R.success(res, result);
  } catch (err) { next(err); }
});

// ── Monitoring / Health ───────────────────────────────────────────────────────
router.get('/monitoring', async (req, res, next) => {
  try {
    const result = await adminService.monitoring();
    return R.success(res, result);
  } catch (err) { next(err); }
});

// ── Audit Logs — paginated ────────────────────────────────────────────────────
router.get('/audit',
  paginationQuery,
  [
    query('entity').optional().isString(),
    query('action').optional().isString(),
    query('userId').optional().isMongoId(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await adminService.auditLogs(req.query);
      return R.paginated(res, result.logs, { page: result.page, limit: result.limit, total: result.total });
    } catch (err) { next(err); }
  }
);

module.exports = router;
