const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');
const { AppError, Errors } = require('../../errors/AppError');

const LIMITS = { free: 50, starter: 5000, growth: 25000, scale: 100000, enterprise: Infinity };

class CreateTransactionService extends BaseService {
  async run() {
    const { date, description, amount, currency, reference, source, category, note } = this.args;
    const userId = this.userId;

    // 1. Check Subscription Limit (Simplified for migration)
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan_id')
      .eq('user_id', userId)
      .single();

    const plan = sub?.plan_id || 'free';
    const limit = LIMITS[plan];

    // Count this month's transactions
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (count >= limit) {
      throw new AppError(Errors.PAYMENT_REQUIRED, { 
        message: `Transaction limit reached for ${plan} plan (${limit}/month). Please upgrade.` 
      });
    }

    // 2. Create Transaction
    const { data: tx, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: userId,
        date, description, amount, currency, reference, source, category, note,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    return { ...tx, _id: tx.id, createdAt: tx.created_at };
  }
}

module.exports = CreateTransactionService;
