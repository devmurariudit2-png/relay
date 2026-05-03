const router = require('express').Router();
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { protect, memberOrAdmin } = require('../middleware/auth');
const audit = require('../middleware/audit');
const { importLimiter } = require('../middleware/security');
const R       = require('../utils/response');
const {
  transactionRules, transactionPatchRules, mongoIdParam, paginationQuery, validate
} = require('../middleware/validate');
const { query } = require('express-validator');

const ListTransactionsService = require('../services/transactions/ListTransactionsService');
const CreateTransactionService = require('../services/transactions/CreateTransactionService');
const GetTransactionSummaryService = require('../services/transactions/GetTransactionSummaryService');
const GetLedgerService = require('../services/transactions/GetLedgerService');
const ImportCsvService = require('../services/transactions/ImportCsvService');
const ReconcileService = require('../services/transactions/ReconcileService');
const GetTransactionService = require('../services/transactions/GetTransactionService');
const UpdateTransactionService = require('../services/transactions/UpdateTransactionService');
const DeleteTransactionService = require('../services/transactions/DeleteTransactionService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(csv)$/i))
      return cb(new Error("Only CSV files are allowed"));
    cb(null, true);
  },
});

router.use(protect);

/**
 * @openapi
 * /transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: List transactions (paginated + filtered)
 *     parameters:
 *       - { in: query, name: page,      schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,     schema: { type: integer, default: 50 } }
 *       - { in: query, name: source,    schema: { type: string, enum: [bank, internal] } }
 *       - { in: query, name: status,    schema: { type: string, enum: [pending, matched, unmatched, exception, duplicate] } }
 *       - { in: query, name: dateFrom,  schema: { type: string, format: date } }
 *       - { in: query, name: dateTo,    schema: { type: string, format: date } }
 *       - { in: query, name: search,    schema: { type: string } }
 *       - { in: query, name: sortBy,    schema: { type: string, enum: [date, amount, createdAt, description] } }
 *       - { in: query, name: sortOrder, schema: { type: string, enum: [asc, desc] } }
 *     responses:
 *       200: { description: Paginated list of transactions }
 *       401: { description: Unauthorized }
 */
// ── GET /transactions — with pagination + filtering ─────────────────────────
router.get(
  "/",
  paginationQuery,
  [
    query("source")
      .optional()
      .isIn(["bank", "internal"])
      .withMessage("Source must be bank or internal"),
    query("status")
      .optional()
      .isIn(["pending", "matched", "unmatched", "exception", "duplicate"])
      .withMessage("Invalid status"),
    query("category").optional().isString(),
    query("dateFrom")
      .optional()
      .isISO8601()
      .withMessage("dateFrom must be ISO date"),
    query("dateTo")
      .optional()
      .isISO8601()
      .withMessage("dateTo must be ISO date"),
    query("search").optional().isString().isLength({ max: 200 }),
    query("sortBy")
      .optional()
      .isIn(["date", "amount", "createdAt", "description"])
      .withMessage("Invalid sortBy"),
    query("sortOrder")
      .optional()
      .isIn(["asc", "desc"])
      .withMessage("sortOrder must be asc or desc"),
  ],
  validate,
  async (req, res, next) => {
    try {
      const result = await ListTransactionsService.execute(req.query, req.context);
      const transactions = result.txs || result.transactions;
      return R.paginated(res, transactions, { page: result.page, limit: result.limit, total: result.total });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @openapi
 * /transactions:
 *   post:
 *     tags: [Transactions]
 *     summary: Create a new transaction (member or admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, description, amount, currency, source]
 *             properties:
 *               date:        { type: string, format: date, example: '2024-01-15' }
 *               description: { type: string, example: 'Payment from client' }
 *               amount:      { type: number, example: 1500.00 }
 *               currency:    { type: string, example: USD }
 *               source:      { type: string, enum: [bank, internal] }
 *               category:    { type: string, example: Revenue }
 *     responses:
 *       201: { description: Transaction created }
 */
// ── POST /transactions ───────────────────────────────────────────────────────
router.post(
  "/",
  memberOrAdmin,
  transactionRules,
  validate,
  audit("CREATE", "Transaction"),
  async (req, res, next) => {
    try {
      const { date, description, amount, currency, reference, source, category, note } = req.body;
      const tx = await CreateTransactionService.execute({
        date, description, amount, currency, reference, source, category, note,
      }, req.context);
      return R.created(res, tx);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * @openapi
 * /transactions/summary:
 *   get:
 *     tags: [Transactions]
 *     summary: Get transaction summary statistics
 *     responses:
 *       200: { description: Summary stats }
 */
// ── GET /transactions/summary ────────────────────────────────────────────────
router.get("/summary", async (req, res, next) => {
  try {
    const summary = await GetTransactionSummaryService.execute({}, req.context);
    return R.success(res, summary);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /transactions/ledger:
 *   get:
 *     tags: [Transactions]
 *     summary: Get ledger view of transactions
 *     parameters:
 *       - { in: query, name: source, schema: { type: string, enum: [bank, internal] } }
 *     responses:
 *       200: { description: Ledger entries }
 */
// ── GET /transactions/ledger ─────────────────────────────────────────────────
router.get(
  "/ledger",
  [
    query("source")
      .optional()
      .isIn(["bank", "internal"])
      .withMessage("Source must be bank or internal"),
  ],
  validate,
  async (req, res, next) => {
    try {
      const source = req.query.source || 'bank';
      const ledger = await GetLedgerService.execute({ source }, req.context);
      return R.success(res, ledger);
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /transactions/import — CSV upload ───────────────────────────────────
router.post('/import',
  protect,
  memberOrAdmin,
  importLimiter,
  upload.single("file"),
  audit("IMPORT", "Transaction"),
  async (req, res, next) => {
    try {
      if (!req.file) return R.badRequest(res, "No file uploaded");
      const { source } = req.body;
      const result = await ImportCsvService.execute({ fileBuffer: req.file.buffer, source }, req.context);
      return R.success(res, result);
    } catch (err) { next(err); }
  }
);

/**
 * @openapi
 * /transactions/reconcile:
 *   post:
 *     tags: [Transactions]
 *     summary: Run the reconciliation algorithm
 *     responses:
 *       200: { description: Reconciliation summary }
 */
// ── POST /transactions/reconcile ─────────────────────────────────────────────
router.post('/reconcile',
  protect,
  memberOrAdmin,
  audit("RECONCILE", "Transaction"),
  async (req, res, next) => {
    try {
      const summary = await ReconcileService.execute({}, req.context);
      return R.success(res, summary);
    } catch (err) { next(err); }
  }
);

/**
 * @openapi
 * /transactions/{id}:
 *   get:
 *     tags: [Transactions]
 *     summary: Get a single transaction by ID
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Transaction object }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Transactions]
 *     summary: Update transaction category or note
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category: { type: string }
 *               note:     { type: string }
 *     responses:
 *       200: { description: Updated transaction }
 *   delete:
 *     tags: [Transactions]
 *     summary: Delete a transaction
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 */
// ── GET /transactions/:id ────────────────────────────────────────────────────
router.get('/:id',
  protect,  
  mongoIdParam(), validate,
  async (req, res, next) => {
    try {
      const tx = await GetTransactionService.execute({ id: req.params.id }, req.context);
      if (!tx) return R.notFound(res, 'Transaction not found');
      return R.success(res, tx);
    } catch (err) { next(err); }
  }
);

// ── PATCH /transactions/:id ───────────────────────────────────────────────────
router.patch('/:id',
  protect,
  memberOrAdmin,
  mongoIdParam(),
  transactionPatchRules,
  validate,
  audit("UPDATE", "Transaction"),
  async (req, res, next) => {
    try {
      const { category, note } = req.body;
      const tx = await UpdateTransactionService.execute({ id: req.params.id, category, note }, req.context);
      if (!tx) return R.notFound(res, 'Transaction not found');
      return R.success(res, tx);
    } catch (err) {
      next(err);
    }
  },
);

// ── DELETE /transactions/:id ─────────────────────────────────────────────────
router.delete('/:id',
  protect,
  memberOrAdmin,
  mongoIdParam(),
  validate,
  audit("DELETE", "Transaction"),
  async (req, res, next) => {
    try {
      const result = await DeleteTransactionService.execute({ id: req.params.id }, req.context);
      return R.success(res, result);
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
