const BaseService = require('../BaseService');
// Models removed
const { AppError, Errors } = require('../../errors/AppError');

class GetTicketService extends BaseService {
  async run() {
    const { id } = this.args;
    const ticket = await Ticket.findById(id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email');

    if (!ticket) {
      throw new AppError(Errors.NOT_FOUND, { message: 'Ticket not found' });
    }

    if (this.user.role !== 'admin' && String(ticket.user._id) !== String(this.userId)) {
      throw new AppError(Errors.FORBIDDEN, { message: 'Access denied' });
    }

    return ticket;
  }
}

module.exports = GetTicketService;
