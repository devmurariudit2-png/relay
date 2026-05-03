const { AppError, Errors } = require("../errors/AppError");

// ── Stateful Mock Store (Shared in memory) ──────────────────────────────────
const MOCK_STORE = {
  transactions: [
    { _id: 'tx1', date: '2024-05-01', description: 'AWS Subscription', amount: -450.00, currency: 'USD', source: 'bank', status: 'matched', reference: 'AWS-99' },
    { _id: 'tx2', date: '2024-05-01', description: 'Internal: AWS Cloud', amount: -450.00, currency: 'USD', source: 'internal', status: 'matched', reference: 'AWS-99' },
    { _id: 'tx3', date: '2024-05-02', description: 'Stripe Payout', amount: 1850.25, currency: 'USD', source: 'bank', status: 'pending', reference: 'ST-101' },
    { _id: 'tx4', date: '2024-05-03', description: 'Office Supplies', amount: -120.00, currency: 'USD', source: 'bank', status: 'unmatched' },
    { _id: 'tx5', date: '2024-05-03', description: 'Client: Acme Corp', amount: 5000.00, currency: 'USD', source: 'bank', status: 'pending' },
  ],
  users: [
    { id: 'demo-user-123', name: 'Demo User', email: 'admin@demo.com', role: 'admin', orgName: 'Relay Demo Org' }
  ]
};

class BaseService {
  constructor(args = {}, context = {}) {
    this.args = args;
    this.context = context;
    this.logger = context.logger;
    this.traceId = context.traceId;
    this.userId = context.user ? (context.user.id || context.user._id) : 'demo-user-123';
    this.user = context.user || MOCK_STORE.users[0];
  }

  static async execute(args = {}, context = {}) {
    const serviceName = this.name;
    const startTime = Date.now();

    if (context && context.logger) {
      context.logger.info(`[${serviceName}] Started`, {
        traceId: context.traceId,
        args: sanitizeArgs(args),
      });
    }

    try {
      const instance = new this(args, context);

      if (typeof instance.validate === "function") {
        instance.validate();
      }

      const result = await instance.run();

      if (context && context.logger) {
        context.logger.info(`[${serviceName}] Completed`, {
          traceId: context.traceId,
          duration: `${Date.now() - startTime}ms`,
          result: sanitizeResult(result),
        });
      }

      return result;
    } catch (error) {
      // ✅ AUTOMATIC FAILOVER TO STATEFUL MOCK
      const isDbError = error.name === "MongoError" || 
                        error.name === "MongooseError" || 
                        error.message.includes("buffering timed out") || 
                        error.message.includes("selection timeout") ||
                        error.message.includes("not connected");

      if (process.env.DEMO_BYPASS === "true" && isDbError) {
        console.log(`[STATEFUL MOCK] DB Unavailable. ${serviceName} is running in memory.`);
        return handleMockRequest(serviceName, args);
      }

      if (context && context.logger) {
        context.logger.error(`[${serviceName}] Failed`, {
          traceId: context.traceId,
          duration: `${Date.now() - startTime}ms`,
          args: sanitizeArgs(args),
          error: {
            message: error.message,
            code: error.code,
            stack: error.stack,
          },
        });
      }

      throw error instanceof AppError
        ? error
        : AppError.wrap(error, context ? context.traceId : undefined);
    }
  }

  async run() {
    throw new AppError(Errors.INTERNAL_ERROR, {
      traceId: this.traceId,
      message: `run() not implemented in ${this.constructor.name}`,
    });
  }

  validate() {}

  async callService(ServiceClass, args = {}) {
    return ServiceClass.execute(args, this.context);
  }
}

function sanitizeArgs(args) {
  const SENSITIVE = ["password", "token", "secret", "accessToken", "refreshToken", "cardNumber"];
  const result = { ...args };
  for (const key of SENSITIVE) {
    if (key in result) result[key] = "***";
  }
  return result;
}

function sanitizeResult(result) {
  if (!result || typeof result !== "object") return result;
  const base = typeof result.toObject === "function" ? result.toObject() : { ...result };
  const summary = {};
  for (const key of Object.keys(base)) {
    const val = base[key];
    if (["accessToken", "refreshToken", "password", "secret", "token"].includes(key)) {
      summary[key] = "***";
    } else {
      summary[key] = val;
    }
  }
  return summary;
}

function handleMockRequest(serviceName, args) {
  const now = new Date().toISOString();
  
  // ── Transactions ────────────────────────────────────────────────────────────
  if (serviceName.includes('ListTransactions')) {
    let txs = [...MOCK_STORE.transactions];
    if (args.source) txs = txs.filter(t => t.source === args.source);
    if (args.status) txs = txs.filter(t => t.status === args.status);
    if (args.search) {
      const s = args.search.toLowerCase();
      txs = txs.filter(t => t.description.toLowerCase().includes(s) || (t.reference && t.reference.toLowerCase().includes(s)));
    }
    return {
      transactions: txs,
      page: 1, limit: 50, total: txs.length, pages: 1
    };
  }

  if (serviceName.includes('CreateTransaction')) {
    const newTx = {
      _id: `tx${Date.now()}`,
      ...args,
      status: 'pending',
      createdAt: now
    };
    MOCK_STORE.transactions.push(newTx);
    return newTx;
  }

  if (serviceName.includes('ImportCsv')) {
    const { parse } = require('csv-parse/sync');
    try {
      const rows = parse(args.fileBuffer, { columns: true, skip_empty_lines: true, trim: true });
      const docs = rows.map((r, i) => ({
        _id: `tx${Date.now()}-${i}`,
        date: r.date,
        description: r.description,
        amount: parseFloat(r.amount),
        currency: (r.currency || 'USD').toUpperCase(),
        reference: r.reference || null,
        source: args.source,
        status: 'pending',
        createdAt: now
      }));
      MOCK_STORE.transactions.push(...docs);
      return { imported: docs.length, source: args.source };
    } catch (e) {
      throw new Error(`CSV Parse failed: ${e.message}`);
    }
  }

  if (serviceName.includes('DeleteTransaction')) {
    const index = MOCK_STORE.transactions.findIndex(t => t._id === args.id);
    if (index !== -1) MOCK_STORE.transactions.splice(index, 1);
    return { success: true };
  }

  if (serviceName.includes('UpdateTransaction')) {
    const tx = MOCK_STORE.transactions.find(t => t._id === args.id);
    if (tx) {
      if (args.category) tx.category = args.category;
      if (args.note) tx.note = args.note;
    }
    return tx;
  }

  if (serviceName.includes('Reconcile')) {
    let matched = 0;
    const bank = MOCK_STORE.transactions.filter(t => t.source === 'bank' && t.status !== 'matched');
    const internal = MOCK_STORE.transactions.filter(t => t.source === 'internal' && t.status !== 'matched');

    for (const b of bank) {
      const match = internal.find(i => Math.abs(i.amount - b.amount) < 0.01 && i.status !== 'matched');
      if (match) {
        b.status = 'matched';
        match.status = 'matched';
        b.matched_id = match._id;
        match.matched_id = b._id;
        matched++;
      }
    }
    
    MOCK_STORE.transactions.forEach(t => {
      if (t.status === 'pending') t.status = 'unmatched';
    });

    return {
      matched,
      unmatched: MOCK_STORE.transactions.filter(t => t.status === 'unmatched').length,
      total: MOCK_STORE.transactions.length,
      status: 'COMPLETED'
    };
  }

  if (serviceName.includes('Summary')) {
    const all = MOCK_STORE.transactions;
    const bankBal = all.filter(t => t.source === 'bank').reduce((s, t) => s + t.amount, 0);
    const intBal = all.filter(t => t.source === 'internal').reduce((s, t) => s + t.amount, 0);
    
    const byStatus = {};
    ['pending', 'matched', 'unmatched', 'exception', 'duplicate'].forEach(s => {
      byStatus[s] = all.filter(t => t.status === s).length;
    });

    return {
      total: all.length,
      bank_balance: Math.round(bankBal * 100) / 100,
      internal_balance: Math.round(intBal * 100) / 100,
      variance: Math.round((bankBal - intBal) * 100) / 100,
      by_status: byStatus,
      accuracy: all.length ? Math.round((all.filter(t => t.status === 'matched').length / all.length) * 100) : 0
    };
  }

  if (serviceName.includes('Ledger')) {
    const source = args.source || 'bank';
    const txs = MOCK_STORE.transactions.filter(t => t.source === source).sort((a, b) => new Date(a.date) - new Date(b.date));
    let balance = 0;
    return txs.map(t => {
      balance += t.amount;
      return {
        id: t._id, date: t.date, description: t.description,
        category: t.category, reference: t.reference,
        debit: t.amount < 0 ? Math.abs(t.amount) : null,
        credit: t.amount > 0 ? t.amount : null,
        balance: Math.round(balance * 100) / 100,
        status: t.status, matched_id: t.matched_id,
      };
    });
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  if (serviceName.includes('Login') || serviceName.includes('Register') || serviceName.includes('GetMe')) {
    const jwt = require('jsonwebtoken');
    const user = MOCK_STORE.users[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
    return { token, user };
  }

  return { success: true, message: 'Mock processed', data: {} };
}

module.exports = BaseService;

