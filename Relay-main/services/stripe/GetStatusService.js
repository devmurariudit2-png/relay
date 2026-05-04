const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');

class GetStatusService extends BaseService {
  async run() {
    if (process.env.SUPABASE_URL) {
      const { data: profile } = await supabase.from('profiles')
        .select('*')
        .eq('id', this.userId)
        .single();

      const { count: txCount } = await supabase.from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId);

      return {
        tier: profile?.subscription_tier || 'free',
        status: profile?.subscription_status || 'active',
        transactionsUsedThisMonth: txCount || 0,
        transactionLimit: profile?.transaction_limit || 100,
        currentPeriodEnd: null,
        stripeCustomerId: profile?.stripe_customer_id || null,
      };
    }

// Models removed
// Models removed
    const orgId = this.user.orgId;
    let sub = await Subscription.findOne({ orgId });
    if (!sub) {
      sub = await Subscription.create({ orgId });
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const actualCount = await Transaction.countDocuments({
      orgId,
      createdAt: { $gte: startOfMonth }
    });

    if (sub.transactionsUsedThisMonth !== actualCount) {
      sub.transactionsUsedThisMonth = actualCount;
      await sub.save();
    }

    return sub;
  }
}

module.exports = GetStatusService;

