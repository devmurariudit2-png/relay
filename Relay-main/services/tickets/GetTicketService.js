const BaseService = require('../BaseService');

class GetTicketService extends BaseService {
  async run() {
    // Note: If SUPABASE_URL is set, BaseService.execute will route to handleSupabaseRequest
    return { ...this.args };
  }
}

module.exports = GetTicketService;
