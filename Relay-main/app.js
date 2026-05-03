// src/app.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');

const contextMiddleware = require('./middleware/context');
const requestLogger = require('./middleware/requestLogger');
const { helmetConfig, apiLimiter } = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const R = require('./utils/response');

const app = express();

// trust proxy (important for prod)
app.set('trust proxy', 1);

// middleware
app.use(contextMiddleware);
app.use(helmetConfig);

// CORS
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
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// logging
app.use(requestLogger);

// rate limit
app.use(apiLimiter);

// health
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// swagger
app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// root
app.get('/', (req, res) => {
  R.success(res, { service: 'Relay API v4' });
});

// routes
app.use('/auth', require('./routes/auth'));
app.use('/transactions', require('./routes/transactions'));
app.use('/tickets', require('./routes/tickets'));
app.use('/team', require('./routes/team'));
app.use('/admin', require('./routes/admin'));
app.use('/stripe', require('./routes/stripe'));

// errors
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;