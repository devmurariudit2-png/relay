const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');

class GetLedgerService extends BaseService {
  async run() {
    const source = this.args.source || 'bank';
    const { data: txs, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', this.userId)
      .eq('source', source)
      .order('date', { ascending: true });

    if (error) throw error;

    let balance = 0;
    const ledger = txs.map(t => {
      balance += t.amount;
      return {
        ...t,
        _id: t.id,
        debit: t.amount < 0 ? Math.abs(t.amount) : null,
        credit: t.amount > 0 ? t.amount : null,
        balance: Math.round(balance * 100) / 100,
      };
    });
    return ledger;
  }
}

module.exports = GetLedgerService;
