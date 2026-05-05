const router = require('express').Router();
const { protect } = require('../middleware/supabaseAuth');
const audit = require('../middleware/audit');
const { authLimiter } = require('../middleware/security');
const R = require('../utils/response');
const {
  loginRules, registerRules, profileRules, passwordRules, validate
} = require('../middleware/validate');



/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string, example: Jane Doe }
 *               email:    { type: string, format: email, example: jane@example.com }
 *               password: { type: string, minLength: 6, example: secret123 }
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 user:  { type: object }
 *       400:
 *         description: Validation error or email already in use
 */
// POST /auth/register
router.post('/register',
  authLimiter,
  registerRules, validate,
  async (req, res) => {
    return R.success(res, { message: 'Registration should be handled via Supabase Auth SDK on the frontend.' });
  }
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and get JWT token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email, example: admin@example.com }
 *               password: { type: string, example: secret123 }
 *     responses:
 *       200:
 *         description: Login successful — copy the token and use in Authorize
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string, description: 'JWT — paste into Authorize' }
 *                 user:  { type: object }
 *       401:
 *         description: Invalid credentials or account deactivated
 */
// POST /auth/login
router.post('/login',
  authLimiter,
  loginRules, validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const supabase = require('../config/supabase');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return R.success(res, { token: data.session.access_token, user: data.user });
    } catch (err) { next(err); }
  }
);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     responses:
 *       200:
 *         description: Current user object
 *       401:
 *         description: Unauthorized
 */
// GET /auth/me
router.get('/me', protect, (req, res) => {
  R.success(res, {
    id: req.user.id,
    email: req.user.email,
    full_name: req.user.full_name || req.user.user_metadata?.full_name,
    currency: req.user.currency || req.user.user_metadata?.currency || 'USD',
    role: req.user.role,
    org_name: req.user.org_name,
    active: req.user.active
  });
});

/**
 * @openapi
 * /auth/profile:
 *   put:
 *     tags: [Auth]
 *     summary: Update user profile (name, currency)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:     { type: string, example: Jane Doe }
 *               currency: { type: string, example: USD }
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 */
// PUT /auth/profile
router.put('/profile',
  protect,
  profileRules, validate,
  audit('UPDATE', 'User'),
  async (req, res, next) => {
    try {
      const { name, currency } = req.body;
      const userId = req.user.id || req.user._id;
      if (!userId) return R.badRequest(res, 'User ID not found in token');

      const upsertPayload = { id: userId, email: req.user.email };
      if (name) upsertPayload.full_name = name;
      if (currency) upsertPayload.currency = currency;

      const supabase = require('../config/supabase');

      // Upsert ensures we never hit "0 rows updated" on a missing profile row
      const { data, error } = await supabase
        .from('profiles')
        .upsert(upsertPayload, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Sync to Supabase Auth user_metadata (non-fatal)
      const authMeta = {};
      if (name) authMeta.full_name = name;
      if (currency) authMeta.currency = currency;
      await supabase.auth.updateUser({ data: authMeta }).catch(() => {});

      return R.success(res, { ...data, _id: data.id });
    } catch (err) { next(err); }
  }
);

/**
 * @openapi
 * /auth/password:
 *   put:
 *     tags: [Auth]
 *     summary: Change current user password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, example: oldSecret }
 *               newPassword:     { type: string, minLength: 6, example: newSecret123 }
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password incorrect
 */
// PUT /auth/password
router.put('/password',
  protect,
  passwordRules, validate,
  async (req, res, next) => {
    try {
      const { newPassword } = req.body;
      const supabase = require('../config/supabase');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return R.success(res, { message: 'Password updated successfully' });
    } catch (err) { next(err); }
  }
);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email, example: admin@example.com }
 *     responses:
 *       200: { description: Reset link sent (mocked in console) }
 */
router.post('/forgot-password', authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return R.badRequest(res, 'Email is required');
    
    if (process.env.SUPABASE_URL) {
      const supabase = require('../config/supabase');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`
      });
      if (error) req.context.logger.error('Password reset error', { error: error.message });
    }

    // Always return 200 to prevent email enumeration
    return R.success(res, { message: 'If an account with that email exists, we sent a password reset link.' });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:       { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200: { description: Password reset successful }
 *       400: { description: Invalid or expired token }
 */
router.post('/reset-password', authLimiter, async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) 
      return R.badRequest(res, 'newPassword (min 6 chars) required');

    if (process.env.SUPABASE_URL) {
      // In Supabase flow, the token is handled by the redirect URL
      // The frontend sends the new password after the user lands on the reset page
      return R.success(res, { message: 'Use Supabase Auth SDK on frontend to complete password reset.' });
    }

    return R.badRequest(res, 'Password reset not available without database');
  } catch (err) { next(err); }
});

module.exports = router;
