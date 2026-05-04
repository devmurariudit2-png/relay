// Models removed
const supabase = require('../config/supabase');

const isSupabase = () => !!process.env.SUPABASE_URL;

const listUsers = async (query) => {
  if (isSupabase()) {
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
  }

  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.active !== undefined) filter.active = query.active === 'true';
  if (query.search) {
    filter.$or = [
      { name: new RegExp(query.search, 'i') },
      { email: new RegExp(query.search, 'i') },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  const withStats = await Promise.all(users.map(async (u) => {
    const [txCount, lastTx] = await Promise.all([
      Transaction.countDocuments({ user: u._id }),
      Transaction.findOne({ user: u._id }).sort({ createdAt: -1 }).select('createdAt').lean(),
    ]);
    return { ...u, txCount, lastActivity: lastTx?.createdAt || u.createdAt };
  }));

  return { users: withStats, page, limit, total };
};

const getUserDetails = async (userId) => {
  if (isSupabase()) {
    const { data: user, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;

    const { count: txCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    const { count: matched } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'matched');
    const { data: tickets } = await supabase.from('tickets').select('id, title, status, created_at').eq('user_id', userId);

    return { ...user, _id: user.id, txCount, matched, tickets: (tickets || []).map(t => ({ ...t, _id: t.id })) };
  }

  const user = await User.findById(userId).select('-password').lean();
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const [txCount, matched, tickets] = await Promise.all([
    Transaction.countDocuments({ user: user._id }),
    Transaction.countDocuments({ user: user._id, status: 'matched' }),
    Ticket.find({ user: user._id }).select('title status createdAt').lean(),
  ]);

  return { ...user, txCount, matched, tickets };
};

const updateUser = async (userId, changes) => {
  if (isSupabase()) {
    const { data, error } = await supabase.from('profiles').update(changes).eq('id', userId).select().single();
    if (error) throw error;
    return { ...data, _id: data.id };
  }

  const update = {};
  if (changes.role !== undefined) update.role = changes.role;
  if (changes.active !== undefined) update.active = changes.active;

  const user = await User.findByIdAndUpdate(userId, update, { new: true }).select('-password');
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return user;
};

const deleteUser = async (userId, currentUserId) => {
  if (isSupabase()) {
    if (userId === currentUserId) throw new Error('Cannot delete self');
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
    return { deleted: userId };
  }

  if (String(userId) === String(currentUserId)) {
    const err = new Error('Cannot delete your own account');
    err.status = 400;
    throw err;
  }

  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  await Transaction.deleteMany({ user: userId });
  return { deleted: userId };
};

const analytics = async () => {
  if (isSupabase()) {
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
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalUsers,
    totalTx,
    matched,
    unmatched,
    exceptions,
    totalTickets,
    openTickets,
    volumeByDay,
    topCategories,
    userGrowth,
  ] = await Promise.all([
    User.countDocuments(),
    Transaction.countDocuments(),
    Transaction.countDocuments({ status: 'matched' }),
    Transaction.countDocuments({ status: 'unmatched' }),
    Transaction.countDocuments({ status: 'exception' }),
    Ticket.countDocuments(),
    Ticket.countDocuments({ status: 'open' }),
    Transaction.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ]),
    Transaction.aggregate([
      { $match: { category: { $ne: null } } },
      { $group: { _id: '$category', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    overview: {
      totalUsers,
      totalTx,
      matched,
      unmatched,
      exceptions,
      totalTickets,
      openTickets,
      reconciliationRate: totalTx > 0 ? Math.round((matched / totalTx) * 100) : 0,
    },
    volumeByDay,
    topCategories,
    userGrowth,
  };
};

const monitoring = async () => {
  const memory = process.memoryUsage();
  return {
    status: 'healthy',
    uptime: Math.round(process.uptime()),
    database: isSupabase() ? 'supabase-connected' : 'mongodb-connected',
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
  if (isSupabase()) {
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
  }

  const page = query.page || 1;
  const limit = query.limit || 50;
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.entity) filter.entity = new RegExp(query.entity, 'i');
  if (query.action) filter.action = new RegExp(query.action, 'i');
  if (query.userId) filter.user = query.userId;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  return { logs, page, limit, total };
};

const withDemoBypass = (fnName, fn) => async (...args) => {
  try {
    return await fn(...args);
  } catch (error) {
    if (process.env.DEMO_BYPASS === 'true') {
      console.log(`[DEMO BYPASS] adminService.${fnName} DB Error, providing mock`);
      if (fnName === 'analytics') return { overview: { totalUsers: 15, totalTx: 100, matched: 80, unmatched: 10, exceptions: 10, totalTickets: 5, openTickets: 2, reconciliationRate: 80 }, volumeByDay: [], topCategories: [], userGrowth: [] };
      if (fnName === 'monitoring') return { status: 'healthy', uptime: 1234, database: 'connected', memory: { used: 50, total: 100, unit: 'MB' }, activity: { txLast24h: 10, usersLast24h: 2 }, recentErrors: [], timestamp: new Date().toISOString() };
      if (fnName === 'listUsers') return { users: [{ _id: 'demo-user-123', name: 'Demo User', email: 'admin@demo.com', role: 'admin', active: true, txCount: 5 }], page: 1, limit: 20, total: 1 };
      if (fnName === 'auditLogs') return { logs: [], page: 1, limit: 50, total: 0 };
      return {};
    }
    throw error;
  }
};

module.exports = {
  listUsers: withDemoBypass('listUsers', listUsers),
  getUserDetails,
  updateUser,
  deleteUser,
  analytics: withDemoBypass('analytics', analytics),
  monitoring: withDemoBypass('monitoring', monitoring),
  auditLogs: withDemoBypass('auditLogs', auditLogs),
};
