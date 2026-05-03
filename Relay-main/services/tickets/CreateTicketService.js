const BaseService = require('../BaseService');
const Ticket = require('../../models/Ticket');

class CreateTicketService extends BaseService {
  async run() {
    const { title, description, priority, category } = this.args;
    const ticket = await Ticket.create({
      user: this.userId,
      title, description, priority, category
    });
    return ticket;
  }
}

module.exports = CreateTicketService;
