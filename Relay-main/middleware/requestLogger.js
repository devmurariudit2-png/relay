const requestLogger = (req, res, next) => {
  const start = Date.now();
  if (req.path !== '/health') {
    req.context.logger.info(`[HTTP] Initiated ${req.method} ${req.originalUrl}`);
  }
  
  res.on('finish', () => {
    if (req.path === '/health') return;
    const duration = Date.now() - start;
    req.context.logger.info(`[HTTP] Completed ${req.method} ${req.originalUrl}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
};

module.exports = requestLogger;
