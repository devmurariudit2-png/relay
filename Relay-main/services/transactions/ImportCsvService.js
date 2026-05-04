const BaseService = require('../BaseService');
// Models removed
// Models removed
const { AppError, Errors } = require('../../errors/AppError');
const { parse } = require('csv-parse/sync');
const mongoose = require('mongoose');

const LIMITS = { free: 10000, starter: 50000, growth: 250000, scale: 1000000, enterprise: Infinity };



class ImportCsvService extends BaseService {
  async run() {

    const startTime = Date.now();

    const { fileBuffer, source } = this.args;

    console.log('=== IMPORT START ===');
    console.log('ARGS:', {
      hasBuffer: !!fileBuffer,
      bufferSize: fileBuffer?.length,
      source,
      userId: this.context.user.id,
      orgId: this.user?.orgId,
    });

    if (!fileBuffer) {
      throw new AppError(Errors.BAD_REQUEST, { message: 'No file uploaded' });
    }

    if (!source || !['bank', 'internal'].includes(source)) {
      throw new AppError(Errors.BAD_REQUEST, { message: 'source (bank|internal) is required' });
    }

    // ── PARSE CSV ─────────────────────────────
    let rows;
    try {
      rows = parse(fileBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      console.log('CSV PARSED:', {
        rowCount: rows.length,
        firstRow: rows[0],
      });

    } catch (parseErr) {
      console.error('CSV PARSE ERROR:', parseErr);
      throw new AppError(Errors.BAD_REQUEST, { message: `CSV parse error: ${parseErr.message}` });
    }

    if (!rows.length) {
      throw new AppError(Errors.BAD_REQUEST, { message: 'CSV file is empty' });
    }

    // ── VALIDATION ────────────────────────────
    const required = ['date', 'description', 'amount'];
    const missing = required.filter(f => !Object.keys(rows[0]).includes(f));

    if (missing.length) {
      console.error('MISSING COLUMNS:', missing);
      throw new AppError(Errors.BAD_REQUEST, {
        message: `CSV missing required columns: ${missing.join(', ')}`,
      });
    }

    const errors = [];

    const docs = rows.map((r, i) => {
      const amt = parseFloat(r.amount);

      if (isNaN(amt)) errors.push(`Row ${i + 2}: invalid amount`);
      if (!r.date) errors.push(`Row ${i + 2}: missing date`);

      return {
        user: this.userId,
        orgId: this.user.orgId,
        date: r.date,
        description: r.description,
        amount: amt,
        currency: (r.currency || 'USD').toUpperCase(),
        reference: r.reference || null,
        source,
        category: r.category || null,
      };
    });

    console.log('DOCS BUILT:', {
      count: docs.length,
      sample: docs[0],
    });

    if (errors.length) {
      console.error('VALIDATION ERRORS:', errors.slice(0, 5));
      const appErr = new AppError(Errors.BAD_REQUEST, { message: 'CSV validation errors' });
      appErr.details = errors.slice(0, 10);
      throw appErr;
    }

    // ── DB CONTEXT CHECK ──────────────────────
    console.log('DB CONTEXT:', {
      dbName: mongoose.connection.name,
      host: mongoose.connection.host,
      collection: Transaction.collection.name,
      readyState: mongoose.connection.readyState, // 1 = connected
    });

    // ── SUBSCRIPTION ──────────────────────────
    let sub = await Subscription.findOne({ orgId: this.user.orgId });

    if (!sub) {
      console.log('No subscription found → creating new');
      sub = await Subscription.create({ orgId: this.user.orgId });
    }

    console.log('SUB BEFORE:', {
      tier: sub.tier,
      used: sub.transactionsUsedThisMonth,
    });

    const now = new Date();

    if (sub.updatedAt && sub.updatedAt.getMonth() !== now.getMonth()) {
      console.log('Resetting monthly usage');
      sub.transactionsUsedThisMonth = 0;
    }

    const limit = LIMITS[sub.tier] || 50;

    console.log('LIMIT CHECK:', {
      limit,
      current: sub.transactionsUsedThisMonth,
      incoming: docs.length,
    });

    if (sub.transactionsUsedThisMonth + docs.length > limit) {
      throw new AppError(Errors.PAYMENT_REQUIRED, { message: `Importing ${docs.length} rows exceeds your ${sub.tier} tier limit (${limit}/month). You have ${limit - sub.transactionsUsedThisMonth} remaining. Please upgrade.` });
    }

    // ── INSERT ────────────────────────────────
    let insertResult;

    try {
      insertResult = await Transaction.insertMany(docs, {
        ordered: false,
        rawResult: true, // 🔥 critical
      });

      console.log('INSERT SUCCESS:', {
        acknowledged: insertResult?.acknowledged,
        insertedCount: insertResult?.insertedCount,
      });

    } catch (err) {
      console.error('INSERT ERROR:', err);

      if (err?.insertedDocs) {
        console.log('PARTIAL INSERT:', err.insertedDocs.length);
      }

      throw err;
    }

    // ── VERIFY WRITE IMMEDIATELY ──────────────
    const verifyCount = await Transaction.countDocuments({
      orgId: this.user.orgId,
    });

    console.log('VERIFY COUNT (ORG):', verifyCount);

    const latest = await Transaction.find({ orgId: this.user.orgId })
      .sort({ _id: -1 })
      .limit(2);

    console.log('LATEST INSERTED:', latest);

    // ── UPDATE SUB ────────────────────────────
    sub.transactionsUsedThisMonth += docs.length;
    await sub.save();

    console.log('SUB AFTER:', {
      used: sub.transactionsUsedThisMonth,
    });

    console.log('=== IMPORT END ===', {
      duration: Date.now() - startTime,
    });

    return { imported: docs.length, source };
  }
}
module.exports = ImportCsvService;
