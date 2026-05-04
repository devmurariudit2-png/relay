const BaseService = require('../BaseService');
// Models removed
const { AppError, Errors } = require('../../errors/AppError');

class RemoveMemberService extends BaseService {
  async run() {
    const { targetUserId } = this.args;
    
    if (String(targetUserId) === String(this.userId)) {
      throw new AppError(Errors.BAD_REQUEST, { message: 'Cannot remove yourself' });
    }

    const user = await User.findByIdAndDelete(targetUserId);
    if (!user) {
      throw new AppError(Errors.NOT_FOUND, { message: 'User not found' });
    }
    
    return { deleted: targetUserId };
  }
}

module.exports = RemoveMemberService;
