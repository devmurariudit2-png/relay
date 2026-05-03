const AuditLog = require('../models/AuditLog');
const logger   = require('../utils/logger');

/**
 * Audit middleware — logs successful mutating actions to AuditLog.
 * Usage: router.post('/', protect, audit('CREATE', 'Transaction'), handler)
 */
const audit = (action, entity) => async (req, res, next) => {
  const original = res.json.bind(res);

  res.json = async (data) => {
    if (res.statusCode < 400 && req.user) {
      try {
        const entityId = req.params?.id
          || (data?.data?._id)
          || (data?._id)
          || null;

        await AuditLog.create({
          user:     req.user._id,
          action,
          entity,
          entityId: entityId ? String(entityId) : null,
          details:  { method: req.method, path: req.path, body: sanitizeBody(req.body) },
          ip:       req.ip,
        });
      } catch (err) {
        logger.error('Audit log failed', { error: err.message });
      }
    }
    return original(data);
  };

  next();
};

/** Strip sensitive fields before storing in audit log */
function sanitizeBody(body) {
  if (!body) return {};
  const { password, currentPassword, newPassword, ...safe } = body;
  return safe;
}

module.exports = audit;
