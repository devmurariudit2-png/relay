const { Errors, ErrorStatusCodes } = require('./errorCodes');

class AppError extends Error {
  constructor(codeOrMessage, payload = {}) {
    let code = codeOrMessage;
    let message = payload.message;
    
    if (!ErrorStatusCodes[code]) {
      // If code is not one of our predefined, assume it's just a message for internal error
      message = codeOrMessage;
      code = Errors.INTERNAL_ERROR;
    }

    super(message || code);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = payload.statusCode || ErrorStatusCodes[code] || 500;
    this.traceId = payload.traceId;
    this.details = payload.details; // e.g. validation error array
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static wrap(error, traceId) {
    if (error instanceof AppError) {
      if (!error.traceId) error.traceId = traceId;
      return error;
    }
    
    const appError = new AppError(Errors.INTERNAL_ERROR, {
      message: error.message,
      traceId,
    });
    
    // Preserve the original stack trace
    appError.stack = error.stack;
    return appError;
  }
}

module.exports = { AppError, Errors };
