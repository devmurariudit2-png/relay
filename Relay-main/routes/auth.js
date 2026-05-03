const router = require('express').Router();
const { protect } = require('../middleware/auth');
const authService = require('../services/authService');
const audit = require('../middleware/audit');
const { authLimiter } = require('../middleware/security');
const R = require('../utils/response');
const {
  loginRules, registerRules, profileRules, passwordRules, validate
} = require('../middleware/validate');
const RegisterService = require('../services/auth/RegisterService');
const LoginService = require('../services/auth/LoginService');
const UpdateProfileService = require('../services/auth/UpdateProfileService');
const ChangePasswordService = require('../services/auth/ChangePasswordService');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

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
  async (req, res, next) => {
    try {
      const result = await RegisterService.execute(req.body, req.context);
      return R.created(res, result);
    } catch (err) { next(err); }
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
      const result = await authService.login({ email, password });
      return R.success(res, result);
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
  R.success(res, req.user.toSafeObject());
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
      const user = await authService.updateProfile(req.user._id, { name, currency });
      return R.success(res, user);
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
      const { currentPassword, newPassword } = req.body;
      const result = await authService.updatePassword(req.user._id, currentPassword, newPassword);
      return R.success(res, result);
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
    
    const user = await User.findOne({ email });
    if (!user) {
      // Return 200 even if user not found to prevent email enumeration
      return R.success(res, { message: 'If an account with that email exists, we sent a password reset link.' });
    }

    const { randomBytes } = require('crypto');
    const resetToken = randomBytes(32).toString('hex');
    user.forgotPasswordToken = resetToken;
    user.forgotPasswordExpires = Date.now() + 1000 * 60 * 60; // 1 hour
    await user.save();

    req.context.logger.info(`[MOCK EMAIL] Password Reset Link: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`);
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
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6) 
      return R.badRequest(res, 'Valid token and newPassword (min 6 chars) required');

    const user = await User.findOne({ 
      forgotPasswordToken: token,
      forgotPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return R.badRequest(res, 'Invalid or expired reset token');

    user.password = newPassword;
    user.forgotPasswordToken = null;
    user.forgotPasswordExpires = null;
    await user.save();

    return R.success(res, { message: 'Password reset successful. You can now login.' });
  } catch (err) { next(err); }
});

module.exports = router;
