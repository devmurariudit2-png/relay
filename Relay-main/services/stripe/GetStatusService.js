const BaseService = require('../BaseService');
const Subscription = require('../../models/Subscription');
const Transaction = require('../../models/Transaction');

class GetStatusService extends BaseService {
  async run() {
    const orgId = this.user.orgId;
    let sub = await Subscription.findOne({ orgId });
    if (!sub) {
      sub = await Subscription.create({ orgId });
    }

    // Dynamically sync transaction count for the current month to prevent drift
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
