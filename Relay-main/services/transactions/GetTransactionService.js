const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');
const { AppError, Errors } = require('../../errors/AppError');

class GetTransactionService extends BaseService {
  async run() {
    const { id } = this.args;
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', this.userId)
      .single();

    if (error || !data) {
      throw new AppError(Errors.NOT_FOUND, { message: 'Transaction not found' });
    }
    return { ...data, _id: data.id, createdAt: data.created_at };
  }
}

module.exports = GetTransactionService;
