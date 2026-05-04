const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BlacklistedToken = require('../models/BlacklistedToken');
const supabase = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

const isSupabase = () => !!process.env.SUPABASE_URL;

const signToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const updateProfile = async (userId, changes) => {
  if (isSupabase()) {
    const update = {};
    if (changes.name) update.full_name = changes.name;
    if (changes.currency) update.currency = changes.currency;
    if (changes.org_name) update.org_name = changes.org_name;

    const { data, error } = await supabase.from('profiles').update(update).eq('id', userId).select().single();
    if (error) throw error;
    return { ...data, _id: data.id };
  }

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
  if (isSupabase()) {
    // Note: We use admin API to update password without current password verification on backend
    // as the session is already verified by 'protect' middleware.
    const { data, error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) throw error;
    return { message: 'Password updated successfully' };
  }

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

const login = async ({ email, password }) => {
  if (isSupabase()) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { token: data.session.access_token, user: data.user };
  }
  // ... legacy login logic ...
};

module.exports = {
  signToken,
  register: async () => { throw new Error('Use Supabase Auth SDK on frontend'); },
  login,
  logout: async () => { /* Handled by frontend SDK */ },
  isTokenRevoked: async () => false,
  updateProfile,
  updatePassword,
};
