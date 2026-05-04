const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');
const { AppError, Errors } = require('../../errors/AppError');

class UpdateTransactionService extends BaseService {
  async run() {
    const { id, category, note } = this.args;
    const { data: tx, error } = await supabase
      .from('transactions')
      .update({ category, note })
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error || !tx) {
      throw new AppError(Errors.NOT_FOUND, { message: 'Transaction not found' });
    }
    return { ...tx, _id: tx.id, createdAt: tx.created_at };
  }
}

module.exports = UpdateTransactionService;
