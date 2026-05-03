require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const jobService = require('./services/jobService');
const logger = require('./utils/logger');
const { helmetConfig, apiLimiter } = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const R = require('./utils/response');

const app = express();

// ✅ FIX FOR RENDER (must be before middleware)
app.set('trust proxy', 1);

const startServer = async () => {
  await connectDB();
  jobService.start();
};

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmetConfig);

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '').split(',').map(u => u.trim()).filter(Boolean),
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (process.env.NODE_ENV !== 'production') return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (/https:\/\/reconciler-.*\.vercel\.app$/.test(origin)) return cb(null, true);
    if (process.env.ALLOW_ALL_ORIGINS === 'true') return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── Request logging ───────────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip: (req) => req.path === '/health',
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use(apiLimiter);

// ── Health check (public, no auth) ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:  'healthy',
    service: 'Reconciler API',
    version: '4.0.0',
    uptime:  Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ── API root ──────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  R.success(res, {
    service: 'Reconciler API',
    version: '4.0.0',
    endpoints: {
      health:       'GET  /health',
      auth:         'POST /auth/login | /auth/register | POST /auth/logout',
      transactions: 'GET  /transactions',
      tickets:      'GET  /tickets',
      team:         'GET  /team',
      admin:        'GET  /admin (admin only)',
      jobs:         'GET  /jobs/:id',
    },
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth',         require('./routes/auth'));
app.use('/transactions', require('./routes/transactions'));
app.use('/tickets',      require('./routes/tickets'));
app.use('/team',         require('./routes/team'));
app.use('/admin',        require('./routes/admin'));
app.use('/jobs',         require('./routes/jobs'));

// ── 404 + Error handlers (must be last) ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

startServer()
  .then(() => {
    app.listen(PORT, () =>
      logger.info(`Reconciler API v4 running on port ${PORT}`, { env: process.env.NODE_ENV })
    );
  })
  .catch((err) => {
    logger.error('Startup failed', { error: err.message, stack: err.stack });
    process.exit(1);
  });