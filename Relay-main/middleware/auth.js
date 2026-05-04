const supabase = require('../config/supabase');
const R = require('../utils/response');

/** Verify Supabase Token and attach user profile */
const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return R.unauthorized(res, 'No token provided');

  const token = auth.split(' ')[1];

  try {
    // 1. Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return R.unauthorized(res, 'Session expired or invalid token');
    }

    // 2. Fetch profile data from PostgreSQL
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Create profile if missing
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert([{ id: user.id, email: user.email, role: 'member' }])
        .select()
        .single();
      req.user = { ...user, ...newProfile, _id: user.id };
    } else {
      req.user = { ...user, ...profile, _id: user.id };
    }

    req.context.user = req.user;
    next();
  } catch (err) {
    return R.unauthorized(res, 'Authentication failed');
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return R.forbidden(res, 'Admin access required');
  next();
};

const memberOrAdmin = (req, res, next) => {
  if (!['admin', 'member'].includes(req.user?.role))
    return R.forbidden(res, 'Write access requires member or admin role');
  next();
};

module.exports = { protect, adminOnly, memberOrAdmin };
