const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const audit = require('../middleware/audit');
const R = require('../utils/response');
const adminService = require('../services/adminService');
const { mongoIdParam, paginationQuery, validate } = require('../middleware/validate');
const { query, body } = require('express-validator');

router.use(protect, adminOnly);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users (admin only)
 *     parameters:
 *       - { in: query, name: page,   schema: { type: integer } }
 *       - { in: query, name: limit,  schema: { type: integer } }
 *       - { in: query, name: role,   schema: { type: string, enum: [admin, member, viewer] } }
 *       - { in: query, name: active, schema: { type: boolean } }
 *       - { in: query, name: search, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated list of users with stats }
 */
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

/**
 * @openapi
 * /admin/users/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get user details and stats
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: User object with stats }
 */
router.get('/users/:id',
  mongoIdParam(), validate,
  async (req, res, next) => {
    try {
      const user = await adminService.getUserDetails(req.params.id);
      return R.success(res, user);
    } catch (err) { next(err); }
  }
);

/**
 * @openapi
 * /admin/users/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Update user role or active status
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:   { type: string, enum: [admin, member, viewer] }
 *               active: { type: boolean }
 *     responses:
 *       200: { description: Updated user }
 */
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

/**
 * @openapi
 * /admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a user
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: User deleted }
 */
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

/**
 * @openapi
 * /admin/analytics:
 *   get:
 *     tags: [Admin]
 *     summary: Get system-wide analytics
 *     responses:
 *       200: { description: System overview, charts data }
 */
// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics', async (req, res, next) => {
  try {
    const result = await adminService.analytics();
    return R.success(res, result);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /admin/monitoring:
 *   get:
 *     tags: [Admin]
 *     summary: Get system health and metrics
 *     responses:
 *       200: { description: Memory, activity, recent errors }
 */
// ── Monitoring / Health ───────────────────────────────────────────────────────
router.get('/monitoring', async (req, res, next) => {
  try {
    const result = await adminService.monitoring();
    return R.success(res, result);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /admin/audit:
 *   get:
 *     tags: [Admin]
 *     summary: List system audit logs
 *     parameters:
 *       - { in: query, name: page,   schema: { type: integer } }
 *       - { in: query, name: limit,  schema: { type: integer } }
 *       - { in: query, name: entity, schema: { type: string } }
 *       - { in: query, name: action, schema: { type: string } }
 *       - { in: query, name: userId, schema: { type: string } }
 *     responses:
 *       200: { description: Paginated logs }
 */
// ── Audit Logs — paginated ────────────────────────────────────────────────────
router.get('/audit',
  paginationQuery,
  [
    query('entity').optional().isString(),
    query('action').optional().isString(),
    query('userId').optional().isString(),
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
