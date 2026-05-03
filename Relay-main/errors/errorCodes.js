const Errors = {
  INTERNAL_ERROR:   'INTERNAL_ERROR',
  NOT_FOUND:        'NOT_FOUND',
  BAD_REQUEST:      'BAD_REQUEST',
  UNAUTHORIZED:     'UNAUTHORIZED',
  FORBIDDEN:        'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PAYMENT_REQUIRED:  'PAYMENT_REQUIRED',
};

const ErrorStatusCodes = {
  [Errors.INTERNAL_ERROR]: 500,
  [Errors.NOT_FOUND]: 404,
  [Errors.BAD_REQUEST]: 400,
  [Errors.UNAUTHORIZED]: 401,
  [Errors.FORBIDDEN]: 403,
  [Errors.VALIDATION_ERROR]: 400,
  [Errors.PAYMENT_REQUIRED]: 402,
};

module.exports = { Errors, ErrorStatusCodes };
