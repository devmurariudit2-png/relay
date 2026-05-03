const router = require('express').Router();
const { protect } = require('../middleware/auth');
const authService = require('../services/authService');
const audit = require('../middleware/audit');
const { authLimiter } = require('../middleware/security');
const R = require('../utils/response');
const {
  loginRules, registerRules, profileRules, passwordRules, validate
} = require('../middleware/validate');

// POST /auth/register
router.post('/register',
  authLimiter,
  registerRules, validate,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      const result = await authService.register({ name, email, password });
      return R.created(res, result);
    } catch (err) { next(err); }
  }
);

// POST /auth/login
router.post('/login',
  authLimiter,
  loginRules, validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      return R.success(res, result);
    } catch (err) { next(err); }
  }
);

// POST /auth/logout
router.post('/logout', protect, async (req, res, next) => {
  try {
    await authService.logout(req.headers.authorization);
    return R.success(res, { message: 'Logged out successfully' });
  } catch (err) { next(err); }
});

// GET /auth/me
router.get('/me', protect, (req, res) => {
  R.success(res, req.user.toSafeObject());
});

// PUT /auth/profile
router.put('/profile',
  protect,
  profileRules, validate,
  audit('UPDATE', 'User'),
  async (req, res, next) => {
    try {
      const { name, currency } = req.body;
      const user = await authService.updateProfile(req.user._id, { name, currency });
      return R.success(res, user);
    } catch (err) { next(err); }
  }
);

// PUT /auth/password
router.put('/password',
  protect,
  passwordRules, validate,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.updatePassword(req.user._id, currentPassword, newPassword);
      return R.success(res, result);
    } catch (err) { next(err); }
  }
);

module.exports = router;
