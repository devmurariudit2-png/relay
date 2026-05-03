const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';
const BLACKLIST_CLEANUP_MS = 60 * 60 * 1000;
const tokenBlacklist = new Map();

const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const cleanupBlacklist = () => {
  const now = Date.now();
  for (const [token, meta] of tokenBlacklist.entries()) {
    if (meta.expiresAt <= now) tokenBlacklist.delete(token);
  }
};

setInterval(cleanupBlacklist, BLACKLIST_CLEANUP_MS).unref?.();

const isTokenRevoked = (token) => {
  cleanupBlacklist();
  return tokenBlacklist.has(token);
};

const register = async ({ name, email, password, orgId, orgName }) => {
  if (await User.findOne({ email })) {
    const err = new Error('Email already registered');
    err.status = 400;
    throw err;
  }

  const user = await User.create({ name, email, password, orgId, orgName });
  return { token: signToken(user._id), user: user.toSafeObject() };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  if (!user.active) {
    const err = new Error('Account deactivated. Contact support.');
    err.status = 401;
    throw err;
  }

  user.lastLoginAt = new Date();
  user.loginCount = (user.loginCount || 0) + 1;
  await user.save();

  return { token: signToken(user._id), user: user.toSafeObject() };
};

const logout = async (rawToken) => {
  if (!rawToken) {
    const err = new Error('No token provided');
    err.status = 401;
    throw err;
  }

  const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7) : rawToken;
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.exp) {
    const err = new Error('Invalid token');
    err.status = 401;
    throw err;
  }

  tokenBlacklist.set(token, { expiresAt: decoded.exp * 1000 });
};

const updateProfile = async (userId, changes) => {
  const update = {};
  if (changes.name) update.name = changes.name;
  if (changes.currency) update.currency = changes.currency;

  const user = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return user.toSafeObject();
};

const updatePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  if (!(await user.matchPassword(currentPassword))) {
    const err = new Error('Current password incorrect');
    err.status = 401;
    throw err;
  }

  user.password = newPassword;
  await user.save();
  return { message: 'Password updated successfully' };
};

module.exports = {
  signToken,
  register,
  login,
  logout,
  isTokenRevoked,
  updateProfile,
  updatePassword,
};
