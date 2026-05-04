const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');
const GetTicketService = require('./GetTicketService');

class UpdateTicketService extends BaseService {
  async run() {
    const { id, comment, ...rawUpdates } = this.args;

    // 1. Handle Comment if present
    if (comment) {
      const { error: commentError } = await supabase.from('ticket_comments').insert([{
        ticket_id: id,
        user_id: this.userId,
        message: comment,
      }]);
      if (commentError) throw commentError;
    }

    // 2. Handle status/priority updates — only pass known columns
    const allowedFields = ['status', 'priority', 'category', 'title', 'description'];
    const updates = {};
    for (const key of allowedFields) {
      if (rawUpdates[key] !== undefined) {
        updates[key] = rawUpdates[key];
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();

      let query = supabase.from('tickets').update(updates).eq('id', id);

      // Admins can update any ticket, members only their own
      if (this.user?.role !== 'admin') {
        query = query.eq('user_id', this.userId);
      }

      const { error } = await query;
      if (error) throw error;
    }

    // Return the updated ticket with comments
    return GetTicketService.execute({ id }, this.context);
  }
}

module.exports = UpdateTicketService;
