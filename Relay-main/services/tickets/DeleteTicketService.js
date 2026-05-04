const BaseService = require('../BaseService');

class DeleteTicketService extends BaseService {
  async run() {
    // Note: If SUPABASE_URL is set, BaseService.execute will route to handleSupabaseRequest
    return { deleted: this.args.id };
  }
}

module.exports = DeleteTicketService;
