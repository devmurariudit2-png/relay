const supabase = require('../config/supabase');
const R = require('../utils/response');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return R.unauthorized(res, 'Missing or invalid authorization header');
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return R.unauthorized(res, 'Invalid or expired token');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    req.user = { ...user, ...(profile || {}), _id: user.id };
    if (!req.context) req.context = {};
    req.context.user = req.user;
    
    next();
  } catch (err) {
    return R.unauthorized(res, 'Authentication error');
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return R.forbidden(res, 'Admin access required');
  next();
};

const memberOrAdmin = (req, res, next) => {
  if (!['admin', 'member'].includes(req.user?.role)) return R.forbidden(res, 'Write access requires member or admin role');
  next();
};

module.exports = { protect, adminOnly, memberOrAdmin };
