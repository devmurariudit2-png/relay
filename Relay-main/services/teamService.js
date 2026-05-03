const User = require('../models/User');

const listTeam = async (user) => {
  const filter = user.orgId ? { orgId: user.orgId } : {};
  const users = await User.find(filter).select('-password').sort({ createdAt: 1 }).lean();

  return users.map((u) => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    orgId: u.orgId,
    orgName: u.orgName,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
  }));
};

const inviteTeamMember = async ({ email, role = 'member' }, inviter) => {
  if (await User.findOne({ email })) {
    const err = new Error('A user with this email already exists');
    err.status = 400;
    throw err;
  }

  return {
    message: `Invite sent to ${email}`,
    email,
    role,
    invitedBy: inviter.name,
    invitedAt: new Date().toISOString(),
  };
};

const updateRole = async (userId, role, currentUserId) => {
  if (String(userId) === String(currentUserId)) {
    const err = new Error('Cannot change your own role');
    err.status = 400;
    throw err;
  }

  const user = await User.findByIdAndUpdate(userId, { role }, { new: true, runValidators: true }).select('-password');
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return { _id: user._id, name: user.name, email: user.email, role: user.role };
};

const removeTeamMember = async (userId, currentUserId) => {
  if (String(userId) === String(currentUserId)) {
    const err = new Error('Cannot remove yourself');
    err.status = 400;
    throw err;
  }

  const user = await User.findByIdAndDelete(userId);
  if (!user) {
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
