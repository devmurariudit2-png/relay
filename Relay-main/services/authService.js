const supabase = require('../config/supabase');

const updateProfile = async (userId, changes) => {
  const update = {};
  if (changes.name) update.full_name = changes.name;
  if (changes.currency) update.currency = changes.currency;
  if (changes.org_name) update.org_name = changes.org_name;

  const { data, error } = await supabase.from('profiles').update(update).eq('id', userId).select().single();
  if (error) throw error;
  return { ...data, _id: data.id };
};

const updatePassword = async (userId, currentPassword, newPassword) => {
  // In Supabase, the password update is handled via auth.updateUser
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return { message: 'Password updated successfully' };
};

const login = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { token: data.session.access_token, user: data.user };
};

module.exports = {
  login,
  updateProfile,
  updatePassword,
};
