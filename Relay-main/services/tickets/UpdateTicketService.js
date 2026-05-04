const BaseService = require('../BaseService');

class UpdateTicketService extends BaseService {
  async run() {
    // Note: If SUPABASE_URL is set, BaseService.execute will route to handleSupabaseRequest
    return { ...this.args, updatedAt: new Date().toISOString() };
  }
}

module.exports = UpdateTicketService;
