const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');
const { AppError, Errors } = require('../../errors/AppError');
const { parse } = require('csv-parse/sync');

const LIMITS = { free: 50, starter: 5000, growth: 25000, scale: 100000, enterprise: Infinity };

class ImportCsvService extends BaseService {
  async run() {
    const startTime = Date.now();
    const { fileBuffer, source } = this.args;
    const userId = this.userId;

    if (!fileBuffer) {
      throw new AppError(Errors.BAD_REQUEST, { message: 'No file uploaded' });
    }

    if (!source || !['bank', 'internal'].includes(source)) {
      throw new AppError(Errors.BAD_REQUEST, { message: 'source (bank|internal) is required' });
    }

    // ── 1. Parse CSV ──────────────────────────────────────────────────────────
    let rows;
    try {
      rows = parse(fileBuffer, {
        columns: header => header.map(h => h.toLowerCase().trim()),
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseErr) {
      throw new AppError(Errors.BAD_REQUEST, { message: `CSV parse error: ${parseErr.message}` });
    }

    if (!rows.length) {
      throw new AppError(Errors.BAD_REQUEST, { message: 'CSV file is empty' });
    }

    // ── 2. Validation ─────────────────────────────────────────────────────────
    const required = ['date', 'description', 'amount'];
    const missing = required.filter(f => !Object.keys(rows[0]).includes(f));

    if (missing.length) {
      throw new AppError(Errors.BAD_REQUEST, {
        message: `CSV missing required columns: ${missing.join(', ')}`,
      });
    }

    const errors = [];
    const docs = rows.map((r, i) => {
      let rawAmt = String(r.amount || '0').replace(/[$,]/g, '');
      const amt = parseFloat(rawAmt);

      if (isNaN(amt)) errors.push(`Row ${i + 2}: invalid amount`);
      if (!r.date) errors.push(`Row ${i + 2}: missing date`);

      // Simple date normalization
      let date = r.date;
      if (date && date.includes('/')) {
        const parts = date.split('/');
        if (parts.length === 3 && parts[2].length === 4) {
          if (parseInt(parts[0]) > 12) { // DD/MM/YYYY
            date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          } else { // MM/DD/YYYY
            date = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
          }
        }
      }

      return {
        user_id: userId,
        date: date || new Date().toISOString().split('T')[0],
        description: r.description || `Imported transaction ${i+1}`,
        amount: isNaN(amt) ? 0 : amt,
        currency: (r.currency || 'USD').toUpperCase(),
        reference: r.reference || r.ref || null,
        category: r.category || null,
        source: source,
        status: 'pending'
      };
    });

    if (errors.length) {
      const appErr = new AppError(Errors.BAD_REQUEST, { message: 'CSV validation errors' });
      appErr.details = errors.slice(0, 10);
      throw appErr;
    }

    // ── 3. Subscription Check ──────────────────────────────────────────────────
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan_id')
      .eq('user_id', userId)
      .single();

    const plan = sub?.plan_id || 'free';
    const limit = LIMITS[plan];

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: currentUsed } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (currentUsed + docs.length > limit) {
      throw new AppError(Errors.PAYMENT_REQUIRED, { 
        message: `Importing ${docs.length} rows exceeds your ${plan} plan limit (${limit}/month). You have ${limit - currentUsed} remaining. Please upgrade.` 
      });
    }

    // ── 4. Batch Insert ────────────────────────────────────────────────────────
    const { data, error: insertError } = await supabase
      .from('transactions')
      .insert(docs)
      .select();

    if (insertError) {
      console.error('Supabase Import Error:', insertError);
      throw insertError;
    }

    return { 
      imported: (data || []).length, 
      source,
      duration: Date.now() - startTime 
    };
  }
}

module.exports = ImportCsvService;
