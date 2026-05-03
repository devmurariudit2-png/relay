const BaseService = require('../BaseService');
const Transaction = require('../../models/Transaction');
const { AppError, Errors } = require('../../errors/AppError');

class GetTransactionService extends BaseService {
  async run() {
    const { id } = this.args;
    const tx = await Transaction.findOne({ _id: id, user: this.userId });
    if (!tx) {
      throw new AppError(Errors.NOT_FOUND, { message: 'Transaction not found' });
    }
    return tx;
  }
}

module.exports = GetTransactionService;
