const BaseService = require('../BaseService');
const User = require('../../models/User');

class GetTeamService extends BaseService {
  async run() {
    const {user} = this.args
    const filter = user ? { orgId: user.orgId } : {};
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: 1 })
      .lean();

    return users.map(u => ({
      _id: u._id, name: u.name, email: u.email,
      role: u.role, active: u.active,
      orgId: u.orgId, orgName: u.orgName,
      lastLoginAt: u.lastLoginAt, createdAt: u.createdAt,
    }));
  }
}

module.exports = GetTeamService;
