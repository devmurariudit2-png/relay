const BaseService = require('../BaseService');
const User = require('../../models/User');
const { AppError, Errors } = require('../../errors/AppError');

class ChangePasswordService extends BaseService {
  async run() {
    const { currentPassword, newPassword } = this.args;
    const user = await User.findById(this.userId);
    
    if (!(await user.matchPassword(currentPassword))) {
      throw new AppError(Errors.UNAUTHORIZED, { message: 'Current password incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    return { message: 'Password updated successfully' };
  }
}

module.exports = ChangePasswordService;
