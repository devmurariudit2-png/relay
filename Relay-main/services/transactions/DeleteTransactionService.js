const BaseService = require('../BaseService');
// Models removed
const { AppError, Errors } = require('../../errors/AppError');

class DeleteTransactionService extends BaseService {
  async run() {
    const { id } = this.args;
    const tx = await Transaction.findOne({ _id: id, user: this.userId });
    if (!tx) {
      throw new AppError(Errors.NOT_FOUND, { message: 'Transaction not found' });
    }
    await tx.deleteOne();
    return { deleted: id };
  }
}

module.exports = DeleteTransactionService;
