const BaseService = require('../BaseService');

class ListTicketsService extends BaseService {
  async run() {
    // Note: If SUPABASE_URL is set, BaseService.execute will route to handleSupabaseRequest
    return { tickets: [], total: 0, page: 1, limit: 20 };
  }
}

module.exports = ListTicketsService;
