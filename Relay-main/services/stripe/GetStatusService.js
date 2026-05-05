const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');

class GetStatusService extends BaseService {
  async run() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const userId = this.userId || (this.user && (this.user.id || this.user._id));

    const [profileResult, txResult] = await Promise.all([
      supabase.from('profiles')
        .select('*')
        .eq('id', userId)
        .single(),
      supabase.from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString())
    ]);

    if (profileResult.error && profileResult.error.code !== 'PGRST116') {
      throw profileResult.error;
    }
    if (txResult.error) {
      throw txResult.error;
    }

    const profile = profileResult.data;
    const txCount = txResult.count;

    return {
      tier: profile?.subscription_tier || 'free',
      status: profile?.subscription_status || 'active',
      transactionsUsedThisMonth: txCount || 0,
      transactionLimit: profile?.transaction_limit || 100,
      currentPeriodEnd: profile?.current_period_end || null,
      stripeCustomerId: profile?.stripe_customer_id || null,
    };
  }
}

module.exports = GetStatusService;
