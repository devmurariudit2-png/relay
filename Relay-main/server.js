require('dotenv').config({ path: require('path').join(__dirname, '.env'), override: false });
const app = require('./app');
const logger = require('./utils/logger');
const jobService = require('./services/jobService');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Initialize background jobs
  jobService.start();
  
  const server = app.listen(PORT, () => {
    logger.info(`Relay API v4 running on port ${PORT}`, { env: process.env.NODE_ENV });
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
};

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => {
    logger.error('Failed to start server', err);
    process.exit(1);
  });
}

module.exports = app;
