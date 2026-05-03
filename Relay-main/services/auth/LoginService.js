const jwt = require('jsonwebtoken');
const BaseService = require('../BaseService');
const User = require('../../models/User');
const { AppError, Errors } = require('../../errors/AppError');

class LoginService extends BaseService {
  signToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  }

  async run() {
    const { email, password } = this.args;
    const user = await User.findOne({ email });
    
    if (!user || !(await user.matchPassword(password))) {
      throw new AppError(Errors.UNAUTHORIZED, { message: 'Invalid email or password' });
    }
    if (!user.active) {
      throw new AppError(Errors.UNAUTHORIZED, { message: 'Account deactivated. Contact support.' });
    }

    user.lastLoginAt = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    return { token: this.signToken(user._id), user: user.toSafeObject() };
  }
}

module.exports = LoginService;
