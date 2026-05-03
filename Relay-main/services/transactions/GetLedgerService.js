const BaseService = require('../BaseService');
const Transaction = require('../../models/Transaction');

class GetLedgerService extends BaseService {
  async run() {
    const source = this.args.source || 'bank';
    const txs = await Transaction.find({ user: this.userId, source }).sort({ date: 1 }).lean();
    let balance = 0;
    const ledger = txs.map(t => {
      balance += t.amount;
      return {
        id: t._id, date: t.date, description: t.description,
        category: t.category, reference: t.reference,
        debit: t.amount < 0 ? Math.abs(t.amount) : null,
        credit: t.amount > 0 ? t.amount : null,
        balance: Math.round(balance * 100) / 100,
        status: t.status, matched_id: t.matched_id,
      };
    });
    return ledger;
  }
}

module.exports = GetLedgerService;
