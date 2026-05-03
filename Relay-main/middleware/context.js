const { randomUUID } = require('crypto');
const logger = require('../utils/logger');

const contextMiddleware = (req, res, next) => {
  const traceId = req.headers['x-trace-id'] || randomUUID();
  req.context = {
    traceId,
    logger: logger.child({ traceId }),
  };
  res.setHeader('X-Trace-Id', traceId);
  next();
};

module.exports = contextMiddleware;
