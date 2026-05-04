const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');

class ListTicketsService extends BaseService {
  async run() {
    let query = supabase.from('tickets').select('*, ticket_comments(*)');
    
    // Admins see all tickets, members only see their own
    if (this.user?.role !== 'admin') {
      query = query.eq('user_id', this.userId);
    }
    
    const { data, count, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    const tickets = (data || []).map(t => ({
      ...t,
      _id: t.id,
      createdAt: t.created_at,
      comments: (t.ticket_comments || []).map(c => ({ 
        ...c, 
        _id: c.id, 
        createdAt: c.created_at 
      }))
    }));

    return { tickets, total: count || tickets.length, page: 1, limit: 50 };
  }
}

module.exports = ListTicketsService;
