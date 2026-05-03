const Transaction = require('../models/Transaction');
const jobService = require('./jobService');

const buildTransactionFilter = (userId, query) => {
  const filter = { user: userId };
  if (query.source) filter.source = query.source;
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = new RegExp(query.category, 'i');

  if (query.dateFrom || query.dateTo) {
    filter.date = {};
    if (query.dateFrom) filter.date.$gte = query.dateFrom;
    if (query.dateTo) filter.date.$lte = query.dateTo;
  }

  if (query.search) {
    filter.$or = [
      { description: new RegExp(query.search, 'i') },
      { reference: new RegExp(query.search, 'i') },
      { category: new RegExp(query.search, 'i') },
    ];
  }

  return filter;
};

const listTransactions = async (user, query) => {
  const page = query.page || 1;
  const limit = query.limit || 50;
  const skip = (page - 1) * limit;
  const filter = buildTransactionFilter(user._id, query);

  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort({ [query.sortBy || 'date']: query.sortOrder === 'asc' ? 1 : -1 }).skip(skip).limit(limit).lean(),
    Transaction.countDocuments(filter),
  ]);

  return { transactions, page, limit, total };
};

const createTransaction = async (user, data) => {
  const tx = await Transaction.create({
    user: user._id,
    orgId: user.orgId,
    date: data.date,
    description: data.description,
    amount: data.amount,
    currency: data.currency,
    reference: data.reference,
    source: data.source,
    category: data.category,
    note: data.note,
  });
  return tx;
};

const getTransaction = async (user, transactionId) => {
  const tx = await Transaction.findOne({ _id: transactionId, user: user._id });
  if (!tx) {
    const err = new Error('Transaction not found');
    err.status = 404;
    throw err;
  }
  return tx;
};

const updateTransaction = async (user, transactionId, changes) => {
  const tx = await Transaction.findOneAndUpdate(
    { _id: transactionId, user: user._id },
    { category: changes.category, note: changes.note },
    { new: true, runValidators: true }
  );
  if (!tx) {
    const err = new Error('Transaction not found');
    err.status = 404;
    throw err;
  }
  return tx;
};

const deleteTransaction = async (user, transactionId) => {
  const tx = await Transaction.findOne({ _id: transactionId, user: user._id });
  if (!tx) {
    const err = new Error('Transaction not found');
    err.status = 404;
    throw err;
  }
  await tx.deleteOne();
  return { deleted: transactionId };
};

const getSummary = async (user) => {
  const all = await Transaction.find({ user: user._id }).lean();
  const bankBal = all.filter((t) => t.source === 'bank').reduce((sum, t) => sum + t.amount, 0);
  const intBal = all.filter((t) => t.source === 'internal').reduce((sum, t) => sum + t.amount, 0);

  const byStatus = {};
  ['pending', 'matched', 'unmatched', 'exception', 'duplicate'].forEach((status) => {
    byStatus[status] = all.filter((t) => t.status === status).length;
  });

  const byCategory = {};
  all.forEach((t) => {
    if (!t.category) return;
    if (!byCategory[t.category]) byCategory[t.category] = { count: 0, total: 0 };
    byCategory[t.category].count += 1;
    byCategory[t.category].total = Math.round((byCategory[t.category].total + t.amount) * 100) / 100;
  });

  return {
    total: all.length,
    bank_balance: Math.round(bankBal * 100) / 100,
    internal_balance: Math.round(intBal * 100) / 100,
    variance: Math.round((bankBal - intBal) * 100) / 100,
    by_status: byStatus,
    by_category: byCategory,
  };
};

const getLedger = async (user, source) => {
  const txs = await Transaction.find({ user: user._id, source }).sort({ date: 1 }).lean();
  let balance = 0;
  return txs.map((t) => {
    balance += t.amount;
    return {
      id: t._id,
      date: t.date,
      description: t.description,
      category: t.category,
      reference: t.reference,
      debit: t.amount < 0 ? Math.abs(t.amount) : null,
      credit: t.amount > 0 ? t.amount : null,
      balance: Math.round(balance * 100) / 100,
      status: t.status,
      matched_id: t.matched_id,
    };
  });
};

const importTransactions = async (user, source, rows) => {
  if (!rows || !rows.length) {
    const err = new Error('CSV file is empty');
    err.status = 400;
    throw err;
  }

  const expected = ['date', 'description', 'amount'];
  const missing = expected.filter((field) => !Object.prototype.hasOwnProperty.call(rows[0], field));
  if (missing.length) {
    const err = new Error(`CSV missing required columns: ${missing.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const errors = [];
  const docs = rows.map((row, index) => {
    const amount = parseFloat(row.amount);
    if (Number.isNaN(amount)) {
      errors.push(`Row ${index + 2}: amount "${row.amount}" is not a number`);
    }
    if (!row.date) {
      errors.push(`Row ${index + 2}: date is required`);
    }
    return {
      user: user._id,
      orgId: user.orgId,
      date: row.date,
      description: row.description,
      amount,
      currency: (row.currency || 'USD').toUpperCase(),
      reference: row.reference || null,
      source,
      category: row.category || null,
    };
  });

  if (errors.length) {
    const err = new Error('CSV validation errors');
    err.status = 400;
    err.errors = errors.slice(0, 10);
    throw err;
  }

  await Transaction.insertMany(docs, { ordered: false });
  return { imported: docs.length, source };
};

const requestReconciliation = async (userId) => jobService.enqueueReconcile(userId);

module.exports = {
  listTransactions,
  createTransaction,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
  getLedger,
  importTransactions,
  requestReconciliation,
};
