const router = require('express').Router();
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { protect, memberOrAdmin } = require('../middleware/auth');
const audit = require('../middleware/audit');
const { importLimiter } = require('../middleware/security');
const R = require('../utils/response');
const transactionService = require('../services/transactionService');
const jobService = require('../services/jobService');
const {
  transactionRules, transactionPatchRules, mongoIdParam, paginationQuery, validate
} = require('../middleware/validate');
const { query } = require('express-validator');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(csv)$/i))
      return cb(new Error('Only CSV files are allowed'));
    cb(null, true);
  },
});

router.use(protect);

// ── GET /transactions — with pagination + filtering ─────────────────────────
router.get('/',
  paginationQuery,
  [
    query('source').optional().isIn(['bank', 'internal']).withMessage('Source must be bank or internal'),
    query('status').optional().isIn(['pending','matched','unmatched','exception','duplicate']).withMessage('Invalid status'),
    query('category').optional().isString(),
    query('dateFrom').optional().isISO8601().withMessage('dateFrom must be ISO date'),
    query('dateTo').optional().isISO8601().withMessage('dateTo must be ISO date'),
    query('search').optional().isString().isLength({ max: 200 }),
    query('sortBy').optional().isIn(['date','amount','createdAt','description']).withMessage('Invalid sortBy'),
    query('sortOrder').optional().isIn(['asc','desc']).withMessage('sortOrder must be asc or desc'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { transactions, page, limit, total } = await transactionService.listTransactions(req.user, req.query);
      return R.paginated(res, transactions, { page, limit, total });
    } catch (err) { next(err); }
  }
);

// ── POST /transactions ───────────────────────────────────────────────────────
router.post('/',
  memberOrAdmin,
  transactionRules, validate,
  audit('CREATE', 'Transaction'),
  async (req, res, next) => {
    try {
      const tx = await transactionService.createTransaction(req.user, req.body);
      return R.created(res, tx);
    } catch (err) { next(err); }
  }
);

// ── GET /transactions/summary ────────────────────────────────────────────────
router.get('/summary', async (req, res, next) => {
  try {
    const summary = await transactionService.getSummary(req.user);
    return R.success(res, summary);
  } catch (err) { next(err); }
});

// ── GET /transactions/ledger ─────────────────────────────────────────────────
router.get('/ledger',
  [query('source').optional().isIn(['bank','internal']).withMessage('Source must be bank or internal')],
  validate,
  async (req, res, next) => {
    try {
      const source = req.query.source || 'bank';
      const ledger = await transactionService.getLedger(req.user, source);
      return R.success(res, ledger);
    } catch (err) { next(err); }
  }
);

// ── POST /transactions/import — CSV upload ───────────────────────────────────
router.post('/import',
  memberOrAdmin,
  importLimiter,
  upload.single('file'),
  audit('IMPORT', 'Transaction'),
  async (req, res, next) => {
    try {
      if (!req.file) return R.badRequest(res, 'No file uploaded');
      const { source } = req.body;
      if (!source || !['bank','internal'].includes(source))
        return R.badRequest(res, 'source (bank|internal) is required');

      let rows;
      try {
        rows = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
      } catch (parseErr) {
        return R.badRequest(res, `CSV parse error: ${parseErr.message}`);
      }

      const result = await transactionService.importTransactions(req.user, source, rows);
      return R.success(res, result);
    } catch (err) {
      if (err.status === 400 && err.errors) return R.badRequest(res, err.message, err.errors);
      next(err);
    }
  }
);

// ── POST /transactions/reconcile ─────────────────────────────────────────────
router.post('/reconcile',
  memberOrAdmin,
  audit('RECONCILE', 'Transaction'),
  async (req, res, next) => {
    try {
      const job = await transactionService.requestReconciliation(req.user._id);
      const completedJob = await jobService.waitForJobResult(job.id, 2500);

      if (completedJob?.status === 'completed') {
        return R.success(res, { jobId: completedJob.id, status: completedJob.status, result: completedJob.result });
      }

      return R.success(res, { jobId: job.id, status: job.status, message: 'Reconciliation queued' });
    } catch (err) { next(err); }
  }
);

// ── GET /transactions/:id ────────────────────────────────────────────────────
router.get('/:id',
  mongoIdParam(), validate,
  async (req, res, next) => {
    try {
      const tx = await transactionService.getTransaction(req.user, req.params.id);
      return R.success(res, tx);
    } catch (err) { next(err); }
  }
);

// ── PATCH /transactions/:id ───────────────────────────────────────────────────
router.patch('/:id',
  memberOrAdmin,
  mongoIdParam(), transactionPatchRules, validate,
  audit('UPDATE', 'Transaction'),
  async (req, res, next) => {
    try {
      const tx = await transactionService.updateTransaction(req.user, req.params.id, req.body);
      return R.success(res, tx);
    } catch (err) { next(err); }
  }
);

// ── DELETE /transactions/:id ─────────────────────────────────────────────────
router.delete('/:id',
  memberOrAdmin,
  mongoIdParam(), validate,
  audit('DELETE', 'Transaction'),
  async (req, res, next) => {
    try {
      const result = await transactionService.deleteTransaction(req.user, req.params.id);
      return R.success(res, result);
    } catch (err) { next(err); }
  }
);

module.exports = router;
