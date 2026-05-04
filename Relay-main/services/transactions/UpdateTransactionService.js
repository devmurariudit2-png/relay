const BaseService = require('../BaseService');
// Models removed
const { AppError, Errors } = require('../../errors/AppError');

class UpdateTransactionService extends BaseService {
  async run() {
    const { id, category, note } = this.args;
    const tx = await Transaction.findOneAndUpdate(
      { _id: id, user: this.userId },
      { category, note },
      { new: true, runValidators: true }
    );
    if (!tx) {
      throw new AppError(Errors.NOT_FOUND, { message: 'Transaction not found' });
    }
    return tx;
  }
}

module.exports = UpdateTransactionService;
