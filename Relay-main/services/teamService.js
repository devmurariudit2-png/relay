// Legacy teamService.js - all team operations are now handled by Supabase-based services:
// - GetTeamService
// - InviteMemberService
// - UpdateRoleService
// - RemoveMemberService

const supabase = require('../config/supabase');

const listTeam = async (user) => {
  let query = supabase.from('profiles').select('*');
  const userOrg = user?.org_name;
  if (userOrg && user?.role !== 'admin') {
    query = query.eq('org_name', userOrg);
  }
  const { data, error } = await query.order('created_at', { ascending: true });
  if (error) throw error;

  return (data || []).map((u) => ({
    _id: u.id,
    name: u.full_name || u.email,
    email: u.email,
    role: u.role,
    active: u.active,
    orgId: u.org_name,
    orgName: u.org_name,
    createdAt: u.created_at,
  }));
};

const inviteTeamMember = async ({ email, role = 'member' }, inviter) => {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    const err = new Error('A user with this email already exists');
    err.status = 400;
    throw err;
  }

  return {
    message: `Invite sent to ${email}`,
    email,
    role,
    invitedBy: inviter?.full_name || inviter?.name || 'Admin',
    invitedAt: new Date().toISOString(),
  };
};

const updateRole = async (userId, role, currentUserId) => {
  if (String(userId) === String(currentUserId)) {
    const err = new Error('Cannot change your own role');
    err.status = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return { _id: data.id, name: data.full_name || data.email, email: data.email, role: data.role };
};

const removeTeamMember = async (userId, currentUserId) => {
  if (String(userId) === String(currentUserId)) {
    const err = new Error('Cannot remove yourself');
    err.status = 400;
    throw err;
  }

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return { deleted: userId };
};

module.exports = {
  listTeam,
  inviteTeamMember,
  updateRole,
  removeTeamMember,
};
