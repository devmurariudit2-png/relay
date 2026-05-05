const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');

class CreateTicketService extends BaseService {
  async run() {
    const { title, description, priority, category } = this.args;

    const userId = this.userId || (this.user && (this.user.id || this.user._id));
    if (!userId) throw new Error('User ID is required to create a ticket');

    const insertData = {
      user_id: userId,
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

    if (error) {
      const msg = error.message || JSON.stringify(error);
      throw new Error(`Ticket creation failed: ${msg}`);
    }

    return {
      ...data,
      _id: data.id,
      createdAt: data.created_at,
    };
  }
}

module.exports = CreateTicketService;
