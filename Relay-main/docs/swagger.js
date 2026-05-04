const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Relay API - Automated Reconciliation Engine',
    version: '4.0.0',
    description: 'Relay — Financial Transaction Reconciliation Platform. All endpoints (except webhooks) require a Bearer JWT token from Supabase Auth. This API provides programmatic access to ledger endpoints, automated reconciliation rules, and Stripe webhook ingestion for subscription management.',
    contact: { name: 'Relay Support' },
  },
  servers: [
    { url: process.env.BACKEND_URL || '/', description: 'Active server' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your Supabase JWT (Access Token). You can obtain this by logging in via the Supabase client SDK or the /auth/login endpoint. Do not include the "Bearer " prefix in the input field, Swagger UI adds it automatically.',
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
    { name: 'Admin',        description: 'Admin-only operations' },
    { name: 'Stripe',       description: 'Subscription & payment management' },
    { name: 'Jobs',         description: 'Background job monitoring' },
    { name: 'System',       description: 'Health & system endpoints' },
  ],
};

const options = {
  swaggerDefinition,
  apis: [path.join(__dirname, '../routes', '*.js')],
};

module.exports = swaggerJsdoc(options);
