const BaseService = require('../BaseService');
const User = require('../../models/User');

class UpdateProfileService extends BaseService {
  async run() {
    const { name, currency } = this.args;
    const update = {};
    if (name) update.name = name;
    if (currency) update.currency = currency;

    const user = await User.findByIdAndUpdate(this.userId, update, { new: true, runValidators: true });
    return user.toSafeObject();
  }
}

module.exports = UpdateProfileService;
