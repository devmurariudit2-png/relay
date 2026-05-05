const supabase = require('../config/supabase');
const logger = require('../utils/logger');
const R = require('../utils/response');

/**
 * Idempotency middleware to prevent duplicate operations.
 * Clients should send an 'Idempotency-Key' header (e.g. a UUID).
 * Useful for POST/PUT requests (like creating transactions or payments).
 */
const idempotency = () => async (req, res, next) => {
  const key = req.headers['idempotency-key'];
  
  if (!key) {
    // If no key is provided, we can either reject or proceed. 
    // Proceeding makes it optional but highly recommended.
    return next();
  }

  const userId = req.user?.id || req.user?._id;
  if (!userId) {
    return next(); // Skip if not authenticated, though it usually is
  }

  try {
    // 1. Check if key exists
    const { data: existing, error: fetchError } = await supabase
      .from('idempotency_keys')
      .select('*')
      .eq('key', key)
      .eq('user_id', userId)
      .single();

    if (existing) {
      if (existing.response_status) {
        // Return cached response
        logger.info('Idempotency cache hit', { key, userId });
        return res.status(existing.response_status).json(existing.response_body);
      } else {
        // Request is currently processing
        return res.status(409).json({ success: false, message: 'Request is already processing' });
      }
    }

    // 2. Register new key (Lock)
    const { error: insertError } = await supabase
      .from('idempotency_keys')
      .insert([{
        key,
        user_id: userId,
        path: req.path,
        method: req.method,
        request_body: req.body
      }]);

    if (insertError) {
      // If constraint violation, another request got in first
      if (insertError.code === '23505') {
        return res.status(409).json({ success: false, message: 'Request is already processing' });
      }
      throw insertError;
    }

    // 3. Intercept response to save result
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      // Only cache success or client errors, not 500s (we want 500s to be retried)
      if (res.statusCode < 500) {
        await supabase
          .from('idempotency_keys')
          .update({
            response_status: res.statusCode,
            response_body: body,
            updated_at: new Date().toISOString()
          })
          .eq('key', key)
          .eq('user_id', userId)
          .catch(err => logger.error('Failed to update idempotency key', { error: err.message, key }));
      } else {
        // If 500, we could delete the key so it can be retried immediately
        await supabase
          .from('idempotency_keys')
          .delete()
          .eq('key', key)
          .eq('user_id', userId)
          .catch(() => {});
      }
      return originalJson(body);
    };

    next();
  } catch (err) {
    logger.error('Idempotency middleware error', { error: err.message, stack: err.stack });
    next(err);
  }
};

module.exports = idempotency;
