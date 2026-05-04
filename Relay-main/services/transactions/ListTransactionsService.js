const BaseService = require('../BaseService');
// Models removed

class ListTransactionsService extends BaseService {
  async run() {
    const { source, status, category, dateFrom, dateTo, search, sortBy = 'date', sortOrder = 'desc', page = 1, limit = 50 } = this.args;
    const skip = (page - 1) * limit;

    const filter = { user: this.userId };
    if (source) filter.source = source;
    if (status) filter.status = status;
    if (category) filter.category = new RegExp(category, 'i');
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = dateFrom;
      if (dateTo) filter.date.$lte = dateTo;
    }
    if (search) {
      filter.$or = [
        { description: new RegExp(search, 'i') },
        { reference: new RegExp(search, 'i') },
        { category: new RegExp(search, 'i') },
      ];
    }

    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const [txs, total] = await Promise.all([
      Transaction.find(filter).sort({ [sortBy]: sortDir }).skip(skip).limit(limit).lean(),
      Transaction.countDocuments(filter),
    ]);

    return { txs, page, limit, total };
  }
}

module.exports = ListTransactionsService;
