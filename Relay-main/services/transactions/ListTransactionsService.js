const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');

class ListTransactionsService extends BaseService {
  async run() {
    const { source, status, search, page = 1, limit = 50 } = this.args;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('transactions').select('*', { count: 'exact' });
    
    // Always scope by user_id
    if (this.userId) {
      query = query.eq('user_id', this.userId);
    }
    
    if (source) query = query.eq('source', source);
    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('description', `%${search}%`);
    
    const { data, count, error } = await query
      .order('date', { ascending: false })
      .range(from, to);

    if (error) throw error;
    
    return {
      txs: data.map(t => ({ ...t, _id: t.id, createdAt: t.created_at })),
      page, 
      limit, 
      total: count, 
      pages: Math.ceil(count / limit)
    };
  }
}

module.exports = ListTransactionsService;
