const BaseService = require('../BaseService');
const User = require('../../models/User');
const { AppError, Errors } = require('../../errors/AppError');

class UpdateRoleService extends BaseService {
  async run() {
    const { targetUserId, role } = this.args;
    
    if (String(targetUserId) === String(this.userId)) {
      throw new AppError(Errors.BAD_REQUEST, { message: 'Cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      targetUserId, { role }, { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new AppError(Errors.NOT_FOUND, { message: 'User not found' });
    }
    
    return { _id: user._id, name: user.name, email: user.email, role: user.role };
  }
}

module.exports = UpdateRoleService;
