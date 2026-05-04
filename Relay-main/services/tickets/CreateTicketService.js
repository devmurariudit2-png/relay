const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');

class CreateTicketService extends BaseService {
  async run() {
    const { title, description, priority, category } = this.args;

    const insertData = {
      user_id: this.userId,
      title,
      description,
      priority: priority || 'medium',
      category: category || 'other',
      status: 'open',
    };

    const { data, error } = await supabase
      .from('tickets')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      _id: data.id,
      createdAt: data.created_at,
    };
  }
}

module.exports = CreateTicketService;
