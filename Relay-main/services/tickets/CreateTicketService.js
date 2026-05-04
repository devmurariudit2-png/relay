const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');

class CreateTicketService extends BaseService {
  async run() {
    const { data, error } = await supabase.from('tickets').insert([{
      ...this.args,
      user_id: this.userId,
      status: 'open'
    }]).select().single();

    if (error) throw error;
    
    // mapId logic
    return { ...data, _id: data.id };
  }
}

module.exports = CreateTicketService;
