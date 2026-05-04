const supabase = require('../config/supabase');

const isSupabase = () => !!process.env.SUPABASE_URL;

const listUsers = async (query) => {
  if (!isSupabase()) {
    if (process.env.DEMO_BYPASS === 'true') {
      return { users: [{ _id: 'demo-user-123', name: 'Demo User', email: 'admin@demo.com', role: 'admin', active: true, txCount: 5 }], page: 1, limit: 20, total: 1 };
    }
    throw new Error('Supabase not configured and MongoDB models missing');
  }

  const page = query.page || 1;
  const limit = query.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let q = supabase.from('profiles').select('*', { count: 'exact' });
  if (query.role) q = q.eq('role', query.role);
  if (query.active !== undefined) q = q.eq('active', query.active === 'true');
  if (query.search) q = q.or(`full_name.ilike.%${query.search}%,email.ilike.%${query.search}%`);

  const { data: users, count, error } = await q.order('created_at', { ascending: false }).range(from, to);
  if (error) throw error;

  const withStats = await Promise.all((users || []).map(async (u) => {
    const { count: txCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', u.id);
    return { ...u, _id: u.id, txCount, lastActivity: u.created_at };
  }));

  return { users: withStats, page, limit, total: count };
};

const getUserDetails = async (userId) => {
  if (!isSupabase()) throw new Error('Supabase not configured');

  const { data: user, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;

  const { count: txCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', userId);
  const { count: matched } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'matched');
  const { data: tickets } = await supabase.from('tickets').select('id, title, status, created_at').eq('user_id', userId);

  return { ...user, _id: user.id, txCount, matched, tickets: (tickets || []).map(t => ({ ...t, _id: t.id })) };
};

const updateUser = async (userId, changes) => {
  if (!isSupabase()) throw new Error('Supabase not configured');

  const { data, error } = await supabase.from('profiles').update(changes).eq('id', userId).select().single();
  if (error) throw error;
  return { ...data, _id: data.id };
};

const deleteUser = async (userId, currentUserId) => {
  if (!isSupabase()) throw new Error('Supabase not configured');
  if (userId === currentUserId) throw new Error('Cannot delete self');

  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;
  return { deleted: userId };
};

const analytics = async () => {
  if (!isSupabase()) {
    if (process.env.DEMO_BYPASS === 'true') {
      return { overview: { totalUsers: 15, totalTx: 100, matched: 80, unmatched: 10, exceptions: 10, totalTickets: 5, openTickets: 2, reconciliationRate: 80 }, volumeByDay: [], topCategories: [], userGrowth: [] };
    }
    throw new Error('Supabase not configured');
  }

  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: totalTx } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
  const { count: matched } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'matched');
  const { count: unmatched } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'unmatched');
  const { count: exceptions } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'exception');
  const { count: totalTickets } = await supabase.from('tickets').select('*', { count: 'exact', head: true });
  const { count: openTickets } = await supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open');

  return {
    overview: {
      totalUsers, totalTx, matched, unmatched, exceptions, totalTickets, openTickets,
      reconciliationRate: totalTx > 0 ? Math.round((matched / totalTx) * 100) : 0,
    },
    volumeByDay: [],
    topCategories: [],
    userGrowth: [],
  };
};

const monitoring = async () => {
  const memory = process.memoryUsage();
  return {
    status: 'healthy',
    uptime: Math.round(process.uptime()),
    database: isSupabase() ? 'supabase-connected' : 'offline',
    memory: {
      used: Math.round(memory.heapUsed / 1024 / 1024),
      total: Math.round(memory.heapTotal / 1024 / 1024),
      unit: 'MB',
    },
    activity: { txLast24h: 0, usersLast24h: 0 },
    recentErrors: [],
    timestamp: new Date().toISOString(),
  };
};

const auditLogs = async (query) => {
  if (!isSupabase()) return { logs: [], page: 1, limit: 50, total: 0 };

  const page = query.page || 1;
  const limit = query.limit || 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let q = supabase.from('audit_logs').select('*, profiles(full_name, email)', { count: 'exact' });
  const { data, count, error } = await q.order('created_at', { ascending: false }).range(from, to);
  if (error) return { logs: [], page, limit, total: 0 };

  return {
    logs: (data || []).map(l => ({ ...l, _id: l.id, user: l.profiles })),
    page, limit, total: count
  };
};

module.exports = {
  listUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  analytics,
  monitoring,
  auditLogs,
};
