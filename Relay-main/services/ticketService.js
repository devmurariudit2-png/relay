// Legacy ticketService.js - all ticket operations are now handled by Supabase-based services:
// - ListTicketsService
// - CreateTicketService
// - GetTicketService
// - UpdateTicketService
// - DeleteTicketService

const supabase = require('../config/supabase');

const listTickets = async (user, query) => {
  const page = query.page || 1;
  const limit = query.limit || 20;

  let q = supabase.from('tickets').select('*, ticket_comments(*)');

  if (user.role !== 'admin') {
    q = q.eq('user_id', user.id || user._id);
  }
  if (query.status) q = q.eq('status', query.status);
  if (query.priority) q = q.eq('priority', query.priority);
  if (query.category) q = q.eq('category', query.category);

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) throw error;

  const tickets = (data || []).map(t => ({
    ...t,
    _id: t.id,
    createdAt: t.created_at,
    comments: (t.ticket_comments || []).map(c => ({
      ...c,
      _id: c.id,
      createdAt: c.created_at,
    })),
  }));

  return { tickets, page, limit, total: tickets.length };
};

const createTicket = async (user, data) => {
  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert([{
      user_id: user.id || user._id,
      title: data.title,
      description: data.description,
      priority: data.priority || 'medium',
      category: data.category || 'other',
      status: 'open',
    }])
    .select()
    .single();

  if (error) throw error;
  return { ...ticket, _id: ticket.id, createdAt: ticket.created_at };
};

const getTicket = async (user, ticketId) => {
  let q = supabase
    .from('tickets')
    .select('*, ticket_comments(*)')
    .eq('id', ticketId);

  if (user.role !== 'admin') {
    q = q.eq('user_id', user.id || user._id);
  }

  const { data, error } = await q.single();
  if (error || !data) {
    const err = new Error('Ticket not found');
    err.status = 404;
    throw err;
  }

  return {
    ...data,
    _id: data.id,
    createdAt: data.created_at,
    comments: (data.ticket_comments || []).map(c => ({
      ...c,
      _id: c.id,
      createdAt: c.created_at,
    })),
  };
};

const updateTicket = async (user, ticketId, changes) => {
  // Handle comment
  if (changes.comment) {
    await supabase.from('ticket_comments').insert([{
      ticket_id: ticketId,
      user_id: user.id || user._id,
      message: changes.comment,
    }]);
  }

  // Handle status/priority updates
  const updates = {};
  if (changes.status) updates.status = changes.status;
  if (changes.priority) updates.priority = changes.priority;

  if (Object.keys(updates).length > 0) {
    let q = supabase.from('tickets').update(updates).eq('id', ticketId);
    if (user.role !== 'admin') {
      q = q.eq('user_id', user.id || user._id);
    }
    const { error } = await q;
    if (error) throw error;
  }

  return getTicket(user, ticketId);
};

const deleteTicket = async (ticketId) => {
  const { error } = await supabase.from('tickets').delete().eq('id', ticketId);
  if (error) throw error;
  return { deleted: ticketId };
};

module.exports = {
  listTickets,
  createTicket,
  getTicket,
  updateTicket,
  deleteTicket,
};
