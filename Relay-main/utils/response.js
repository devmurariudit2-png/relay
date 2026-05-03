/**
 * Standardized API Response Helpers
 * All responses follow the shape: { success, data?, message?, meta?, errors? }
 */

const success = (res, data = null, statusCode = 200, meta = null) => {
  const body = { success: true };
  if (data !== null) body.data = data;
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

const created = (res, data = null) => success(res, data, 201);

const paginated = (res, data, { page, limit, total }) => {
  const pages = Math.ceil(total / limit);
  return success(res, data, 200, { page, limit, total, pages, hasMore: page < pages });
};

const error = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

const notFound = (res, message = 'Resource not found') => error(res, message, 404);
const badRequest = (res, message = 'Bad request', errors = null) => error(res, message, 400, errors);
const unauthorized = (res, message = 'Unauthorized') => error(res, message, 401);
const forbidden = (res, message = 'Forbidden') => error(res, message, 403);

module.exports = { success, created, paginated, error, notFound, badRequest, unauthorized, forbidden };
