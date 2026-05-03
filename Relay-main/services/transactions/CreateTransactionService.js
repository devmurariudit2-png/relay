const BaseService = require('../BaseService');
const Transaction = require('../../models/Transaction');
const Subscription = require('../../models/Subscription');
const { AppError, Errors } = require('../../errors/AppError');

const LIMITS = { free: 10000, starter: 50000, growth: 250000, scale: 1000000, enterprise: Infinity };

class CreateTransactionService extends BaseService {
  async run() {
    const { date, description, amount, currency, reference, source, category, note } = this.args;
    
    // Check Subscription Limit
    let sub = await Subscription.findOne({ orgId: this.user.orgId });
    if (!sub) sub = await Subscription.create({ orgId: this.user.orgId });

    // Reset usage if it's a new month (simplified check)
    const now = new Date();
    if (sub.updatedAt && sub.updatedAt.getMonth() !== now.getMonth()) {
      sub.transactionsUsedThisMonth = 0;
    }

    const limit = LIMITS[sub.tier] || 50;
    if (sub.transactionsUsedThisMonth >= limit) {
      throw new AppError(Errors.PAYMENT_REQUIRED, { message: `Transaction limit reached for ${sub.tier} tier (${limit}/month). Please upgrade.` });
    }

    const tx = await Transaction.create({
      user: this.user, orgId: this.user.orgId,
      date, description, amount, currency, reference, source, category, note,
    });

    sub.transactionsUsedThisMonth += 1;
    await sub.save();

    return tx;
  }
}

module.exports = CreateTransactionService;
