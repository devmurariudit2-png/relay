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
      if (process.env.SUPABASE_URL) {
        return await handleSupabaseRequest(serviceName, args, context);
      }

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
      // ✅ AUTOMATIC FAILOVER TO SUPABASE/FALLBACK HANDLER
      const isDbError = error.name === "MongoError" || 
                        error.name === "MongooseError" || 
                        error.message.includes("buffering timed out") || 
                        error.message.includes("selection timeout") ||
                        error.message.includes("not connected");

      if ((process.env.DEMO_BYPASS === "true" || process.env.SUPABASE_URL) && isDbError) {
        console.log(`[SERVICE FAILOVER] DB Unavailable or Supabase Mode. ${serviceName} is running via SQL handler.`);
        return handleSupabaseRequest(serviceName, args, context);
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

const supabase = require('../config/supabase');

async function handleSupabaseRequest(serviceName, args, context) {
  const now = new Date().toISOString();
  const userId = context.user ? (context.user.id || context.user._id) : null;
  
  const mapId = (obj) => {
    if (!obj) return obj;
    if (Array.isArray(obj)) return obj.map(o => ({ ...o, _id: o.id }));
    return { ...obj, _id: obj.id };
  };

  // ── Transactions ────────────────────────────────────────────────────────────
  if (serviceName.includes('ListTransactions')) {
    let query = supabase.from('transactions').select('*', { count: 'exact' });
    
    if (userId) query = query.eq('user_id', userId);
    if (args.source) query = query.eq('source', args.source);
    if (args.status) query = query.eq('status', args.status);
    if (args.search) query = query.ilike('description', `%${args.search}%`);
    
    const { data, count, error } = await query.order('date', { ascending: false });
    if (error) throw error;
    
    return {
      transactions: mapId(data),
      page: 1, limit: 50, total: count, pages: 1
    };
  }

  if (serviceName.includes('GetTransaction')) {
    const { data, error } = await supabase.from('transactions').select('*').eq('id', args.id).eq('user_id', userId).single();
    if (error) throw error;
    return mapId(data);
  }

  if (serviceName.includes('CreateTransaction')) {
    const { data, error } = await supabase.from('transactions').insert([{
      ...args,
      user_id: userId,
      status: 'pending'
    }]).select().single();
    if (error) throw error;
    return mapId(data);
  }

  if (serviceName.includes('ImportCsv')) {
    let rows;
    try {
      rows = parse(args.fileBuffer, { 
        columns: header => header.map(h => h.toLowerCase().trim()),
        skip_empty_lines: true, 
        trim: true 
      });
    } catch (err) {
      throw new AppError(Errors.BAD_REQUEST, { message: `CSV Parse Error: ${err.message}` });
    }
    
    if (!rows || rows.length === 0) {
      return { imported: 0, source: args.source };
    }

    const docs = rows.map((r, i) => {
      // Robust amount parsing: remove currency symbols and commas
      let rawAmt = String(r.amount || '0').replace(/[$,]/g, '');
      const amount = parseFloat(rawAmt);

      // Simple date normalization (handle DD/MM/YYYY or MM/DD/YYYY to YYYY-MM-DD if possible)
      let date = r.date;
      if (date && date.includes('/')) {
        const parts = date.split('/');
        if (parts.length === 3) {
          if (parts[2].length === 4) { // DD/MM/YYYY or MM/DD/YYYY
             // Assume ISO-ish for now or try to reformat
             // This is a guess, but YYYY-MM-DD is safest for PG
             if (parseInt(parts[0]) > 12) { // DD/MM/YYYY
               date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
             } else { // MM/DD/YYYY
               date = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
             }
          }
        }
      }

      return {
        date: date || new Date().toISOString().split('T')[0],
        description: r.description || `Imported transaction ${i+1}`,
        amount: isNaN(amount) ? 0 : amount,
        currency: (r.currency || 'USD').toUpperCase(),
        reference: r.reference || r.ref || null,
        category: r.category || null,
        source: args.source || 'bank',
        status: 'pending',
        user_id: userId
      };
    });

    const { data, error } = await supabase.from('transactions').insert(docs).select();
    if (error) {
      console.error('Supabase Import Error:', error);
      throw error;
    }
    return { imported: (data || []).length, source: args.source };
  }

  if (serviceName.includes('DeleteTransaction')) {
    const { error } = await supabase.from('transactions').delete().eq('id', args.id).eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  }

  if (serviceName.includes('UpdateTransaction')) {
    const { data, error } = await supabase.from('transactions')
      .update(args)
      .eq('id', args.id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return mapId(data);
  }

  if (serviceName.includes('Reconcile')) {
    // 1. Reset all user transactions to pending
    await supabase.from('transactions').update({ status: 'pending', matched_id: null }).eq('user_id', userId);

    // 2. Fetch all transactions
    const { data: allTx } = await supabase.from('transactions').select('*').eq('user_id', userId);
    if (!allTx || allTx.length === 0) {
      return { matched: 0, unmatched: 0, duplicates: 0, exceptions: 0, total: 0, bank_total: 0, internal_total: 0, variance: 0, status: 'BALANCED', unmatched_bank: 0, unmatched_internal: 0 };
    }

    const bank = allTx.filter(t => t.source === 'bank');
    const internal = allTx.filter(t => t.source === 'internal');
    const usedB = new Set();
    const usedI = new Set();
    const updates = []; // { id, status, matched_id }

    // 3. Pass 1 — exact reference + exact amount
    const internalByRef = new Map();
    for (const i of internal) {
      if (!i.reference) continue;
      if (!internalByRef.has(i.reference)) internalByRef.set(i.reference, []);
      internalByRef.get(i.reference).push(i);
    }
    for (const b of bank) {
      if (!b.reference || usedB.has(b.id)) continue;
      const candidates = internalByRef.get(b.reference);
      if (!candidates) continue;
      for (const i of candidates) {
        if (usedI.has(i.id)) continue;
        if (Math.abs(i.amount - b.amount) < 0.01) {
          updates.push({ id: b.id, status: 'matched', matched_id: i.id });
          updates.push({ id: i.id, status: 'matched', matched_id: b.id });
          usedB.add(b.id);
          usedI.add(i.id);
          break;
        }
      }
    }

    // 4. Pass 2 — exact amount + date within 3 days
    for (const b of bank) {
      if (usedB.has(b.id)) continue;
      const bd = new Date(b.date).getTime();
      for (const i of internal) {
        if (usedI.has(i.id)) continue;
        const dayDiff = Math.abs(new Date(i.date).getTime() - bd) / 86400000;
        if (Math.abs(i.amount - b.amount) < 0.01 && dayDiff <= 3) {
          updates.push({ id: b.id, status: 'matched', matched_id: i.id });
          updates.push({ id: i.id, status: 'matched', matched_id: b.id });
          usedB.add(b.id);
          usedI.add(i.id);
          break;
        }
      }
    }

    // 5. Apply matched updates
    for (const u of updates) {
      await supabase.from('transactions').update({ status: u.status, matched_id: u.matched_id }).eq('id', u.id);
    }

    // 6. Detect duplicates — same source, same amount, same ref, within 1 day
    const pending = allTx.filter(t => !usedB.has(t.id) && !usedI.has(t.id));
    const duplicateIds = new Set();
    const dupMap = new Map();
    for (const t of pending) {
      const key = `${t.source}_${Math.round(t.amount * 100)}_${t.reference || ''}`;
      if (!dupMap.has(key)) {
        dupMap.set(key, [t]);
      } else {
        const existing = dupMap.get(key);
        for (const e of existing) {
          if (Math.abs(new Date(t.date).getTime() - new Date(e.date).getTime()) / 86400000 <= 1) {
            duplicateIds.add(t.id);
            break;
          }
        }
        existing.push(t);
      }
    }
    for (const id of duplicateIds) {
      await supabase.from('transactions').update({ status: 'duplicate' }).eq('id', id);
    }

    // 7. Flag exceptions — large unmatched (>= 10,000)
    const THRESHOLD = 10000;
    const exceptionIds = pending.filter(t => !duplicateIds.has(t.id) && Math.abs(t.amount) >= THRESHOLD).map(t => t.id);
    for (const id of exceptionIds) {
      await supabase.from('transactions').update({ status: 'exception' }).eq('id', id);
    }

    // 8. Everything else → unmatched
    const unmatchedIds = pending.filter(t => !duplicateIds.has(t.id) && !exceptionIds.includes(t.id)).map(t => t.id);
    for (const id of unmatchedIds) {
      await supabase.from('transactions').update({ status: 'unmatched' }).eq('id', id);
    }

    // 9. Build summary
    const { data: final } = await supabase.from('transactions').select('*').eq('user_id', userId);
    const bankTxs = final.filter(t => t.source === 'bank');
    const intTxs = final.filter(t => t.source === 'internal');
    const bankTotal = Math.round(bankTxs.reduce((s, t) => s + t.amount, 0) * 100) / 100;
    const internalTotal = Math.round(intTxs.reduce((s, t) => s + t.amount, 0) * 100) / 100;
    const variance = Math.round((bankTotal - internalTotal) * 100) / 100;
    const count = (st) => final.filter(t => t.status === st).length;

    return {
      matched: count('matched'),
      unmatched: count('unmatched'),
      duplicates: count('duplicate'),
      exceptions: count('exception'),
      total: final.length,
      bank_total: bankTotal,
      internal_total: internalTotal,
      variance,
      status: variance === 0 ? 'BALANCED' : 'VARIANCE DETECTED',
      unmatched_bank: bankTxs.filter(t => t.status === 'unmatched').length,
      unmatched_internal: intTxs.filter(t => t.status === 'unmatched').length,
    };
  }

  if (serviceName.includes('Summary')) {
    const { data: all } = await supabase.from('transactions').select('amount, source, status').eq('user_id', userId);
    const bankBal = all.filter(t => t.source === 'bank').reduce((s, t) => s + t.amount, 0);
    const intBal = all.filter(t => t.source === 'internal').reduce((s, t) => s + t.amount, 0);
    
    return {
      total: all.length,
      bank_total: Math.round(bankBal * 100) / 100,
      internal_total: Math.round(intBal * 100) / 100,
      variance: Math.round((bankBal - intBal) * 100) / 100
    };
  }

  if (serviceName.includes('Ledger')) {
    const { data, error } = await supabase.from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('source', args.source || 'bank')
      .order('date', { ascending: true });
    if (error) throw error;
    
    let balance = 0;
    const mapped = data.map(t => {
      balance += t.amount;
      return {
        ...t,
        _id: t.id,
        debit: t.amount < 0 ? Math.abs(t.amount) : null,
        credit: t.amount > 0 ? t.amount : null,
        balance: Math.round(balance * 100) / 100
      };
    });
    return mapped;
  }

  // ── Team ────────────────────────────────────────────────────────────────────
  if (serviceName.includes('GetTeam')) {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return mapId(data);
  }
  
  if (serviceName.includes('InviteMember')) {
    const { data, error } = await supabase.from('profiles').insert([{
      email: args.email,
      role: args.role,
      active: true
    }]).select().single();
    if (error) throw error;
    return mapId(data);
  }

  if (serviceName.includes('UpdateRole')) {
    const { data, error } = await supabase.from('profiles').update({ role: args.role }).eq('id', args.targetUserId).select().single();
    if (error) throw error;
    return mapId(data);
  }

  if (serviceName.includes('RemoveMember')) {
    const { error } = await supabase.from('profiles').delete().eq('id', args.targetUserId);
    if (error) throw error;
    return { success: true };
  }

  // ── Tickets ─────────────────────────────────────────────────────────────────
  if (serviceName.includes('ListTickets')) {
    const { data, count, error } = await supabase.from('tickets').select('*, ticket_comments(*)').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return { tickets: mapId(data), total: count, page: 1, limit: 50 };
  }

  if (serviceName.includes('GetTicket')) {
    const { data, error } = await supabase.from('tickets').select('*, ticket_comments(*)').eq('id', args.id).eq('user_id', userId).single();
    if (error) throw error;
    return mapId(data);
  }

  if (serviceName.includes('UpdateTicket')) {
    const { data, error } = await supabase.from('tickets').update(args).eq('id', args.id).eq('user_id', userId).select().single();
    if (error) throw error;
    return mapId(data);
  }

  if (serviceName.includes('DeleteTicket')) {
    const { error } = await supabase.from('tickets').delete().eq('id', args.id).eq('user_id', userId);
    if (error) throw error;
    return { success: true };
  }

  if (serviceName.includes('CreateTicket')) {
    const { data, error } = await supabase.from('tickets').insert([{
      ...args,
      user_id: userId,
      status: 'open'
    }]).select().single();
    if (error) throw error;
    return mapId(data);
  }

  return { success: true, message: 'Supabase processed' };
}

module.exports = BaseService;

