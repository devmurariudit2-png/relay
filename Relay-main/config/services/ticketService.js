const Ticket = require('../models/Ticket');

const listTickets = async (user, query) => {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;
  const filter = user.role === 'admin' ? {} : { user: user._id };

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = query.category;

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Ticket.countDocuments(filter),
  ]);

  return { tickets, page, limit, total };
};

const createTicket = async (user, data) => {
  const ticket = await Ticket.create({
    user: user._id,
    title: data.title,
    description: data.description,
    priority: data.priority,
    category: data.category,
  });
  return ticket;
};

const getTicket = async (user, ticketId) => {
  const ticket = await Ticket.findById(ticketId)
    .populate('user', 'name email')
    .populate('assignedTo', 'name email')
    .populate('comments.user', 'name email');

  if (!ticket) {
    const err = new Error('Ticket not found');
    err.status = 404;
    throw err;
  }

  if (user.role !== 'admin' && String(ticket.user._id) !== String(user._id)) {
    const err = new Error('Access denied');
    err.status = 403;
    throw err;
  }

  return ticket;
};

const updateTicket = async (user, ticketId, changes) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    const err = new Error('Ticket not found');
    err.status = 404;
    throw err;
  }

  if (user.role !== 'admin' && String(ticket.user) !== String(user._id)) {
    const err = new Error('Access denied');
    err.status = 403;
    throw err;
  }

  if (user.role === 'admin') {
    if (changes.status) ticket.status = changes.status;
    if (changes.priority) ticket.priority = changes.priority;
    if (changes.assignedTo) ticket.assignedTo = changes.assignedTo;
  }

  if (changes.comment) {
    ticket.comments.push({ user: user._id, message: changes.comment });
  }

  await ticket.save();
  return ticket;
};

const deleteTicket = async (ticketId) => {
  const ticket = await Ticket.findByIdAndDelete(ticketId);
  if (!ticket) {
    const err = new Error('Ticket not found');
    err.status = 404;
    throw err;
  }
  return { deleted: ticketId };
};

module.exports = {
  listTickets,
  createTicket,
  getTicket,
  updateTicket,
  deleteTicket,
};
