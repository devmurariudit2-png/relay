const BaseService = require('../BaseService');
// Models removed
const { AppError, Errors } = require('../../errors/AppError');

class UpdateTicketService extends BaseService {
  async run() {
    const { id, status, priority, assignedTo, comment } = this.args;
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      throw new AppError(Errors.NOT_FOUND, { message: 'Ticket not found' });
    }

    if (this.user.role !== 'admin' && String(ticket.user) !== String(this.userId)) {
      throw new AppError(Errors.FORBIDDEN, { message: 'Access denied' });
    }

    if (this.user.role === 'admin') {
      if (status) ticket.status = status;
      if (priority) ticket.priority = priority;
      if (assignedTo) ticket.assignedTo = assignedTo;
    }

    if (comment) {
      ticket.comments.push({ user: this.userId, message: comment });
    }

    await ticket.save();
    return ticket;
  }
}

module.exports = UpdateTicketService;
