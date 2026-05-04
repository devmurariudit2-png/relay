const router = require("express").Router();
// Models removed (handled by services)
const { protect, memberOrAdmin, adminOnly } = require("../middleware/supabaseAuth");
const audit = require("../middleware/audit");
const R = require("../utils/response");
const {
  ticketRules,
  ticketPatchRules,
  mongoIdParam,
  paginationQuery,
  validate,
} = require("../middleware/validate");
const { query } = require("express-validator");

const ListTicketsService = require("../services/tickets/ListTicketsService");
const CreateTicketService = require("../services/tickets/CreateTicketService");
const GetTicketService = require("../services/tickets/GetTicketService");
const UpdateTicketService = require("../services/tickets/UpdateTicketService");
const DeleteTicketService = require("../services/tickets/DeleteTicketService");

router.use(protect);

/**
 * @openapi
 * /tickets:
 *   get:
 *     tags: [Tickets]
 *     summary: List tickets (paginated + filtered)
 *     parameters:
 *       - { in: query, name: page,     schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,    schema: { type: integer, default: 50 } }
 *       - { in: query, name: status,   schema: { type: string, enum: [open, in-progress, resolved, closed] } }
 *       - { in: query, name: priority, schema: { type: string, enum: [low, medium, high, critical] } }
 *       - { in: query, name: category, schema: { type: string, enum: [bug, feature, billing, access, other] } }
 *     responses:
 *       200: { description: Paginated list of tickets }
 *       401: { description: Unauthorized }
 */
// ── GET /tickets — paginated + filterable ────────────────────────────────────
router.get(
  "/",
  paginationQuery,
  [
    query("status")
      .optional()
      .isIn(["open", "in_progress", "resolved", "closed"]),
    query("priority").optional().isIn(["low", "medium", "high", "critical"]),
    query("category")
      .optional()
      .isIn(["bug", "feature", "billing", "access", "other"]),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await ListTicketsService.execute(
        {
          ...req.query,
          user: req.user,
        },
        req.context,
      );
      return R.paginated(res, result.tickets, {
        page: result.page,
        limit: result.limit,
        total: result.total,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @openapi
 * /tickets:
 *   post:
 *     tags: [Tickets]
 *     summary: Create a new ticket (member or admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title:       { type: string, example: 'Missing invoice' }
 *               description: { type: string, example: 'Payment not reflected in ledger' }
 *               priority:    { type: string, enum: [low, medium, high, critical], default: medium }
 *               category:    { type: string, enum: [bug, feature, billing, access, other], default: other }
 *     responses:
 *       201: { description: Ticket created }
 *       401: { description: Unauthorized }
 */
// ── POST /tickets ────────────────────────────────────────────────────────────
router.post(
  "/",
  memberOrAdmin,
  ticketRules,
  validate,
  audit("CREATE", "Ticket"),
  async (req, res, next) => {
    try {
      const ticket = await CreateTicketService.execute(req.body, req.context);
      return R.created(res, ticket);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @openapi
 * /tickets/{id}:
 *   get:
 *     tags: [Tickets]
 *     summary: Get a ticket by ID
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Ticket object }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Tickets]
 *     summary: Update ticket status/priority (member or admin)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:   { type: string, enum: [open, in-progress, resolved, closed] }
 *               priority: { type: string, enum: [low, medium, high, critical] }
 *     responses:
 *       200: { description: Updated ticket }
 *   delete:
 *     tags: [Tickets]
 *     summary: Delete a ticket (admin only)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deleted }
 */
// ── GET /tickets/:id ─────────────────────────────────────────────────────────
router.get("/:id", mongoIdParam(), validate, async (req, res, next) => {
  try {
    const ticket = await GetTicketService.execute(
      { id: req.params.id },
      req.context,
    );
    return R.success(res, ticket);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /tickets/:id ───────────────────────────────────────────────────────
router.patch(
  "/:id",
  memberOrAdmin,
  mongoIdParam(),
  ticketPatchRules,
  validate,
  audit("UPDATE", "Ticket"),
  async (req, res, next) => {
    try {
      const ticket = await UpdateTicketService.execute(
        { id: req.params.id, ...req.body },
        req.context,
      );
      return R.success(res, ticket);
    } catch (err) {
      next(err);
    }
  },
);

// ── DELETE /tickets/:id — admin only ─────────────────────────────────────────
router.delete(
  "/:id",
  adminOnly,
  mongoIdParam(),
  validate,
  audit("DELETE", "Ticket"),
  async (req, res, next) => {
    try {
      const result = await DeleteTicketService.execute(
        { id: req.params.id },
        req.context,
      );
      return R.success(res, result);
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
