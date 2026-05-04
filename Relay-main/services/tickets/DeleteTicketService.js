const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');

class DeleteTicketService extends BaseService {
  async run() {
    let query = supabase.from('tickets').delete().eq('id', this.args.id);
    
    if (this.user?.role !== 'admin') {
      query = query.eq('user_id', this.userId);
    }

    const { error } = await query;
    if (error) throw error;
    return { success: true };
  }
}

module.exports = DeleteTicketService;
