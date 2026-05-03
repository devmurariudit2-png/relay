const BaseService = require('../BaseService');
const Ticket = require('../../models/Ticket');

class ListTicketsService extends BaseService {
  async run() {
    const { status, priority, category, page = 1, limit = 20 , user } = this.args;
    const skip = (page - 1) * limit;

    const filter = user.role === 'admin' ? {} : { user: user.id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate('user', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      Ticket.countDocuments(filter),
    ]);

    return { tickets, page, limit, total };
  }
}

module.exports = ListTicketsService;
