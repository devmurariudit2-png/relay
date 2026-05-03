const router = require('express').Router();
const { protect, memberOrAdmin, adminOnly } = require('../middleware/auth');
const audit = require('../middleware/audit');
const R = require('../utils/response');
const ticketService = require('../services/ticketService');
const { ticketRules, ticketPatchRules, mongoIdParam, paginationQuery, validate } = require('../middleware/validate');
const { query } = require('express-validator');

router.use(protect);

// ── GET /tickets — paginated + filterable ────────────────────────────────────
router.get('/',
  paginationQuery,
  [
    query('status').optional().isIn(['open','in-progress','resolved','closed']),
    query('priority').optional().isIn(['low','medium','high','critical']),
    query('category').optional().isIn(['bug','feature','billing','access','other']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { tickets, page, limit, total } = await ticketService.listTickets(req.user, req.query);
      return R.paginated(res, tickets, { page, limit, total });
    } catch (err) { next(err); }
  }
);

// ── POST /tickets ────────────────────────────────────────────────────────────
router.post('/',
  memberOrAdmin,
  ticketRules, validate,
  audit('CREATE', 'Ticket'),
  async (req, res, next) => {
    try {
      const ticket = await ticketService.createTicket(req.user, req.body);
      return R.created(res, ticket);
    } catch (err) { next(err); }
  }
);

// ── GET /tickets/:id ─────────────────────────────────────────────────────────
router.get('/:id',
  mongoIdParam(), validate,
  async (req, res, next) => {
    try {
      const ticket = await ticketService.getTicket(req.user, req.params.id);
      return R.success(res, ticket);
    } catch (err) { next(err); }
  }
);

// ── PATCH /tickets/:id ───────────────────────────────────────────────────────
router.patch('/:id',
  memberOrAdmin,
  mongoIdParam(), ticketPatchRules, validate,
  audit('UPDATE', 'Ticket'),
  async (req, res, next) => {
    try {
      const ticket = await ticketService.updateTicket(req.user, req.params.id, req.body);
      return R.success(res, ticket);
    } catch (err) { next(err); }
  }
);

// ── DELETE /tickets/:id — admin only ─────────────────────────────────────────
router.delete('/:id',
  adminOnly,
  mongoIdParam(), validate,
  audit('DELETE', 'Ticket'),
  async (req, res, next) => {
    try {
      const result = await ticketService.deleteTicket(req.params.id);
      return R.success(res, result);
    } catch (err) { next(err); }
  }
);

module.exports = router;
