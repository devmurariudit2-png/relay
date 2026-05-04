const { AppError, Errors } = require("../errors/AppError");
const { parse } = require('csv-parse/sync');

// ── Fallback Store (In-memory seed data for demo/offline mode) ───────────────
const FALLBACK_STORE = {
  transactions: [
    { _id: 'tx1', date: '2024-05-01', description: 'AWS Subscription', amount: -450.00, currency: 'USD', source: 'bank', status: 'matched', reference: 'AWS-99' },
    { _id: 'tx2', date: '2024-05-01', description: 'Internal: AWS Cloud', amount: -450.00, currency: 'USD', source: 'internal', status: 'matched', reference: 'AWS-99' },
    { _id: 'tx3', date: '2024-05-02', description: 'Stripe Payout', amount: 1850.25, currency: 'USD', source: 'bank', status: 'pending', reference: 'ST-101' },
    { _id: 'tx4', date: '2024-05-03', description: 'Office Supplies', amount: -120.00, currency: 'USD', source: 'bank', status: 'unmatched' },
    { _id: 'tx5', date: '2024-05-03', description: 'Client: Acme Corp', amount: 5000.00, currency: 'USD', source: 'bank', status: 'pending' },
  ],
  users: [
    { _id: 'demo-user-123', name: 'Demo User', email: 'admin@demo.com', role: 'admin', orgName: 'Relay Demo Org', active: true, createdAt: new Date().toISOString() }
  ],
  tickets: [
    { _id: 'tk1', title: 'Need help with AWS transaction', description: 'Why is AWS billed twice?', priority: 'high', category: 'billing', status: 'open', createdAt: new Date().toISOString() }
  ]
};

class BaseService {
  constructor(args = {}, context = {}) {
    this.args = args;
    this.context = context;
    this.logger = context.logger;
    this.traceId = context.traceId;
    this.userId = context.user ? (context.user.id || context.user._id) : 'demo-user-123';
    this.user = context.user || FALLBACK_STORE.users[0];
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

module.exports = BaseService;

