const BaseService = require('../BaseService');
const Ticket = require('../../models/Ticket');
const { AppError, Errors } = require('../../errors/AppError');

class DeleteTicketService extends BaseService {
  async run() {
    const { id } = this.args;
    const ticket = await Ticket.findByIdAndDelete(id);
    if (!ticket) {
      throw new AppError(Errors.NOT_FOUND, { message: 'Ticket not found' });
    }
    return { deleted: id };
  }
}

module.exports = DeleteTicketService;
