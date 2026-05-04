const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');
const { AppError, Errors } = require('../../errors/AppError');

class GetTicketService extends BaseService {
  async run() {
    const { id } = this.args;
    let query = supabase.from('tickets').select('*, ticket_comments(*)').eq('id', id);
    
    if (this.user?.role !== 'admin') {
      query = query.eq('user_id', this.userId);
    }

    const { data, error } = await query.single();
    if (error || !data) {
      throw new AppError(Errors.NOT_FOUND, { message: 'Ticket not found' });
    }
    
    const ticket = {
      ...data,
      _id: data.id,
      createdAt: data.created_at,
      comments: (data.ticket_comments || []).map(c => ({ 
        ...c, 
        _id: c.id, 
        createdAt: c.created_at 
      }))
    };

    return ticket;
  }
}

module.exports = GetTicketService;
