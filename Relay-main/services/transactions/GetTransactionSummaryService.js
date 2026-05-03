const BaseService = require('../BaseService');
const Transaction = require('../../models/Transaction');

class GetTransactionSummaryService extends BaseService {
  async run() {
    const all = await Transaction.find({ user: this.userId }).lean();
    const bankBal = all.filter(t => t.source === 'bank').reduce((a, t) => a + t.amount, 0);
    const intBal = all.filter(t => t.source === 'internal').reduce((a, t) => a + t.amount, 0);
    const byStatus = {};
    ['pending', 'matched', 'unmatched', 'exception', 'duplicate'].forEach(s => {
      byStatus[s] = all.filter(t => t.status === s).length;
    });
    const byCategory = {};
    all.forEach(t => {
      if (!t.category) return;
      if (!byCategory[t.category]) byCategory[t.category] = { count: 0, total: 0 };
      byCategory[t.category].count++;
      byCategory[t.category].total = Math.round((byCategory[t.category].total + t.amount) * 100) / 100;
    });
    return {
      total: all.length,
      bank_balance: Math.round(bankBal * 100) / 100,
      internal_balance: Math.round(intBal * 100) / 100,
      variance: Math.round((bankBal - intBal) * 100) / 100,
      by_status: byStatus,
      by_category: byCategory,
    };
  }
}

module.exports = GetTransactionSummaryService;
