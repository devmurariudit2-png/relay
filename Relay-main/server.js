require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi    = require('swagger-ui-express');
const connectDB    = require('./config/db');
const logger       = require('./utils/logger');
const contextMiddleware = require('./middleware/context');
const requestLogger = require('./middleware/requestLogger');
const { helmetConfig, apiLimiter } = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const R = require('./utils/response');
const jobService = require('./services/jobService');


// ── OpenAPI / Swagger spec ────────────────────────────────────────────────────
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Relay API',
    version: '4.0.0',
    description: 'Relay — Financial Transaction Reconciliation Platform. All endpoints (except /health and /auth/login, /auth/register) require a Bearer JWT token.',
    contact: { name: 'Relay Support' },
  },
  servers: [
    { url: process.env.BACKEND_URL || 'http://localhost:5000', description: 'Active server' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the JWT token returned by POST /auth/login',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error message' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page:  { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 50 },
          total: { type: 'integer', example: 200 },
          pages: { type: 'integer', example: 4 },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  tags: [
    { name: 'Auth',         description: 'Authentication & user profile' },
    { name: 'Transactions', description: 'Financial transaction management' },
    { name: 'Tickets',      description: 'Support ticket management' },
    { name: 'Team',         description: 'Team / organization management' },
    { name: 'Admin',        description: 'Admin-only operations (role: admin)' },
    { name: 'System',       description: 'Health & system endpoints' },
  ],
};

const swaggerSpec = swaggerJsdoc({
  swaggerDefinition,
  apis: [path.join(__dirname, 'routes', '*.js')],
});

const app = express();

// ✅ FIX FOR RENDER (must be before middleware)
app.set('trust proxy', 1);

const startServer = async () => {
  await connectDB();
  jobService.start();
};

// ── Context Provider ────────────────────────────────────────────────────────
app.use(contextMiddleware);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmetConfig);

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
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
app.use(requestLogger);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ 
  limit: '1mb',
  verify: (req, res, buf) => {
    if (req.originalUrl === '/stripe/webhook') {
      req.rawBody = buf.toString();
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use(apiLimiter);

// ── Health check (public, no auth) ───────────────────────────────────────────
/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     description: Returns the current health and uptime of the API server.
 *     security: []
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:    { type: string, example: healthy }
 *                 service:   { type: string, example: 'Relay API' }
 *                 version:   { type: string, example: '4.0.0' }
 *                 uptime:    { type: integer, example: 3600 }
 *                 timestamp: { type: string, format: date-time }
 */
app.get('/health', (req, res) => {
  res.json({
    status:  'healthy',
    service: 'Relay API',
    version: '4.0.0',
    uptime:  Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ── Swagger / OpenAPI ─────────────────────────────────────────────────────────
// Raw JSON spec — consumed by the frontend API Docs page
app.get('/api-docs.json', cors(corsOptions), (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Swagger HTML UI (bonus — accessible directly in browser)
app.use('/api-docs', cors(corsOptions), swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Relay API Docs',
  customCss: `
    .swagger-ui .topbar { display: none !important; }
    .swagger-ui .info .title { color: #EF4444; }
    .swagger-ui .btn.authorize { background: #EF4444; border-color: #EF4444; }
    .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #EF4444; }
  `,
}));

// ── API root ──────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  R.success(res, {
    service: 'Relay API',
    version: '4.0.0',
    docs:    '/api-docs',
    spec:    '/api-docs.json',
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
app.use('/stripe',       require('./routes/stripe'));

// ── 404 + Error handlers (must be last) ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
  await startServer();
  logger.info(`Reconciler API v4 running on port ${PORT}`, { env: process.env.NODE_ENV });
});


// Graceful shutdown to fix nodemon EADDRINUSE
const mongoose = require('mongoose');

const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed.');
    } catch (err) {
      logger.error('Error closing MongoDB connection', err);
    }
    if (signal === 'SIGUSR2') {
      process.kill(process.pid, 'SIGUSR2');
    } else {
      process.exit(0);
    }
  });
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGUSR2', () => shutdown('SIGUSR2'));
