const BaseService = require('../BaseService');
// Models removed
// Models removed

class GetTeamService extends BaseService {
  async run() {
    const { user } = this.args;
    const filter = user ? { orgId: user.orgId } : { orgId: this.user.orgId };
    
    const [users, invites] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: 1 }).lean(),
      InviteToken.find({ ...filter, expiresAt: { $gt: new Date() } }).lean()
    ]);

    const activeMembers = users.map(u => ({
      _id: u._id, name: u.name, email: u.email,
      role: u.role, active: u.active,
      orgId: u.orgId, orgName: u.orgName,
      lastLoginAt: u.lastLoginAt, createdAt: u.createdAt,
    }));

    const pendingInvites = invites.map(i => ({
      _id: i._id, name: "Pending Invite", email: i.email,
      role: i.role, active: false,
      isInvite: true,
      createdAt: i.createdAt,
    }));

    return [...activeMembers, ...pendingInvites];
  }
}

module.exports = GetTeamService;
