const BaseService = require('../BaseService');

class CreateTicketService extends BaseService {
  async run() {
    // Note: If SUPABASE_URL is set, BaseService.execute will route to handleSupabaseRequest
    // This run() is the legacy/fallback path.
    return { ...this.args, user: this.userId, createdAt: new Date().toISOString() };
  }
}

module.exports = CreateTicketService;
