const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');
const { AppError, Errors } = require('../../errors/AppError');

class DeleteTransactionService extends BaseService {
  async run() {
    const { id } = this.args;
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId);

    if (error) {
      throw new AppError(Errors.NOT_FOUND, { message: 'Transaction not found or could not be deleted' });
    }
    return { deleted: id };
  }
}

module.exports = DeleteTransactionService;
