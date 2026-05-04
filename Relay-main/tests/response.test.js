import { describe, it, expect, vi, beforeEach } from 'vitest';
import responseUtils from '../utils/response.js';

describe('Response Utility', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
  });

  describe('success', () => {
    it('should return 200 and success: true by default', () => {
      responseUtils.success(mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    it('should include data when provided', () => {
      responseUtils.success(mockRes, { foo: 'bar' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: { foo: 'bar' } });
    });

    it('should allow custom status codes', () => {
      responseUtils.success(mockRes, null, 202);
      expect(mockRes.status).toHaveBeenCalledWith(202);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    it('should include meta data when provided', () => {
      responseUtils.success(mockRes, null, 200, { page: 1 });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, meta: { page: 1 } });
    });
  });

  describe('created', () => {
    it('should return 201 and success: true', () => {
      responseUtils.created(mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    it('should include data when provided', () => {
      responseUtils.created(mockRes, { id: 1 });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
    });
  });

  describe('paginated', () => {
    it('should return 200, success, and paginated meta', () => {
      responseUtils.paginated(mockRes, [{ id: 1 }, { id: 2 }], { page: 1, limit: 10, total: 25 });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 1 }, { id: 2 }],
        meta: { page: 1, limit: 10, total: 25, pages: 3, hasMore: true }
      });
    });

    it('should correctly set hasMore to false on last page', () => {
      responseUtils.paginated(mockRes, [{ id: 1 }], { page: 3, limit: 10, total: 25 });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 1 }],
        meta: { page: 3, limit: 10, total: 25, pages: 3, hasMore: false }
      });
    });
  });

  describe('error', () => {
    it('should return 500 and a default error message', () => {
      responseUtils.error(mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'An error occurred' });
    });

    it('should allow custom error message and status code', () => {
      responseUtils.error(mockRes, 'Custom error', 422);
      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Custom error' });
    });

    it('should include validation errors if provided', () => {
      responseUtils.error(mockRes, 'Validation failed', 400, [{ field: 'name', error: 'Required' }]);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'name', error: 'Required' }]
      });
    });
  });

  describe('notFound', () => {
    it('should return 404 with a default message', () => {
      responseUtils.notFound(mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Resource not found' });
    });

    it('should allow a custom message', () => {
      responseUtils.notFound(mockRes, 'User not found');
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'User not found' });
    });
  });

  describe('badRequest', () => {
    it('should return 400 with a default message', () => {
      responseUtils.badRequest(mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Bad request' });
    });

    it('should allow a custom message and validation errors', () => {
      responseUtils.badRequest(mockRes, 'Invalid input', [{ msg: 'Too short' }]);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid input',
        errors: [{ msg: 'Too short' }]
      });
    });
  });

  describe('unauthorized', () => {
    it('should return 401 with a default message', () => {
      responseUtils.unauthorized(mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Unauthorized' });
    });

    it('should allow a custom message', () => {
      responseUtils.unauthorized(mockRes, 'Invalid token');
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Invalid token' });
    });
  });

  describe('forbidden', () => {
    it('should return 403 with a default message', () => {
      responseUtils.forbidden(mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Forbidden' });
    });

    it('should allow a custom message', () => {
      responseUtils.forbidden(mockRes, 'Access denied');
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Access denied' });
    });
  });
});
