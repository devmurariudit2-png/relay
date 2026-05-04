const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');

class GetTeamService extends BaseService {
  async run() {
    const { user } = this.args;
    const currentUser = user || this.user;

    let query = supabase.from('profiles').select('*');

    // Filter by organization if the user has one (non-admins only see their org)
    const userOrg = currentUser?.org_name;
    if (userOrg && currentUser?.role !== 'admin') {
      query = query.eq('org_name', userOrg);
    }

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;

    return (data || []).map(u => ({
      _id: u.id,
      name: u.full_name || u.email,
      email: u.email,
      role: u.role,
      active: u.active,
      orgId: u.org_name,
      orgName: u.org_name,
      createdAt: u.created_at,
    }));
  }
}

module.exports = GetTeamService;
