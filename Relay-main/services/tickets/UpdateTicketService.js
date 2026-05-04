const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');
const GetTicketService = require('./GetTicketService');

class UpdateTicketService extends BaseService {
  async run() {
    const { id, comment, ...updates } = this.args;
    
    // 1. Handle Comment if present
    if (comment) {
      await supabase.from('ticket_comments').insert([{
        ticket_id: id,
        user_id: this.userId,
        message: comment
      }]);
    }

    // 2. Handle status/priority updates
    if (Object.keys(updates).length > 0) {
      let query = supabase.from('tickets').update(updates).eq('id', id);
      
      // Admins can update any ticket, members only their own
      if (this.user?.role !== 'admin') {
        query = query.eq('user_id', this.userId);
      }

      const { data, error } = await query.select().single();
      if (error) throw error;
    }

    // If only a comment was added, return the updated ticket with comments
    return GetTicketService.execute({ id }, this.context);
  }
}

module.exports = UpdateTicketService;
