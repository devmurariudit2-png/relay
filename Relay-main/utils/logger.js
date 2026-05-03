const { createLogger, format, transports, config } = require('winston');
const { combine, timestamp, errors, json, colorize, simple } = format;

const logger = createLogger({
  levels: config.npm.levels,
  level: process.env.LOG_LEVEL || 'http',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'reconciler-api' },
  transports: [
    new transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? combine(timestamp(), json())
        : combine(colorize(), simple()),
    }),
  ],
});

module.exports = logger;
