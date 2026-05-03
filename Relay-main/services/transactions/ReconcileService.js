const BaseService = require('../BaseService');
const Transaction = require('../../models/Transaction');

class ReconcileService extends BaseService {
  async run() {
    // ── 1. Reset all to pending ───────────────────────────────────────────────
    await Transaction.updateMany(
      { user: this.userId },
      { $set: { status: 'pending', matched_id: null } }
    );

    const bank = await Transaction.find({ user: this.userId, source: 'bank' });
    const internal = await Transaction.find({ user: this.userId, source: 'internal' });

    const usedB = new Set();
    const usedI = new Set();
    const updates = [];

    // ── 2. Pass 1 — exact reference + exact amount ────────────────────────────
    for (const b of bank) {
      if (!b.reference || usedB.has(String(b._id))) continue;
      for (const i of internal) {
        if (usedI.has(String(i._id))) continue;
        if (i.reference === b.reference && Math.abs(i.amount - b.amount) < 0.01) {
          updates.push({ id: b._id, status: 'matched', matched_id: i._id });
          updates.push({ id: i._id, status: 'matched', matched_id: b._id });
          usedB.add(String(b._id));
          usedI.add(String(i._id));
          break;
        }
      }
    }

    // ── 3. Pass 2 — exact amount + date within 3 days (no reference needed) ──
    for (const b of bank) {
      if (usedB.has(String(b._id))) continue;
      const bd = new Date(b.date);
      for (const i of internal) {
        if (usedI.has(String(i._id))) continue;
        const dayDiff = Math.abs(new Date(i.date) - bd) / 86400000;
        if (Math.abs(i.amount - b.amount) < 0.01 && dayDiff <= 3) {
          updates.push({ id: b._id, status: 'matched', matched_id: i._id });
          updates.push({ id: i._id, status: 'matched', matched_id: b._id });
          usedB.add(String(b._id));
          usedI.add(String(i._id));
          break;
        }
      }
    }

    // ── 4. Apply matched updates ──────────────────────────────────────────────
    for (const u of updates) {
      await Transaction.findByIdAndUpdate(u.id, {
        $set: { status: u.status, matched_id: u.matched_id }
      });
    }

    // ── 5. Detect duplicates — same source, same amount, same ref, within 1 day
    const pending = await Transaction.find({ user: this.userId, status: 'pending' });
    const duplicateIds = new Set();

    for (let i = 0; i < pending.length; i++) {
      for (let j = i + 1; j < pending.length; j++) {
        const a = pending[i], b = pending[j];
        if (duplicateIds.has(String(b._id))) continue;
        const sameSrc = a.source === b.source;
        const sameAmt = Math.abs(a.amount - b.amount) < 0.01;
        const sameRef = a.reference && b.reference && a.reference === b.reference;
        const closeDate = Math.abs(new Date(a.date) - new Date(b.date)) / 86400000 <= 1;
        if (sameSrc && sameAmt && sameRef && closeDate) {
          duplicateIds.add(String(b._id));
        }
      }
    }

    if (duplicateIds.size > 0) {
      await Transaction.updateMany(
        { _id: { $in: [...duplicateIds] } },
        { $set: { status: 'duplicate' } }
      );
    }

    // ── 6. Flag exceptions — large unmatched amounts (over 10,000) ───────────
    const EXCEPTION_THRESHOLD = 10000;
    const stillPending = await Transaction.find({ user: this.userId, status: 'pending' });
    const exceptionIds = stillPending
      .filter(t => Math.abs(t.amount) >= EXCEPTION_THRESHOLD)
      .map(t => t._id);

    if (exceptionIds.length > 0) {
      await Transaction.updateMany(
        { _id: { $in: exceptionIds } },
        { $set: { status: 'exception' } }
      );
    }

    // ── 7. Everything else → unmatched ───────────────────────────────────────
    await Transaction.updateMany(
      { user: this.userId, status: 'pending' },
      { $set: { status: 'unmatched' } }
    );

    // ── 8. Build summary ──────────────────────────────────────────────────────
    const all = await Transaction.find({ user: this.userId });
    const bankTxs = all.filter(t => t.source === 'bank');
    const intTxs = all.filter(t => t.source === 'internal');

    const bankTotal = bankTxs.reduce((s, t) => s + t.amount, 0);
    const internalTotal = intTxs.reduce((s, t) => s + t.amount, 0);
    const variance = Math.round((bankTotal - internalTotal) * 100) / 100;

    const count = (status) => all.filter(t => t.status === status).length;

    return {
      matched: count('matched'),
      unmatched: count('unmatched'),
      duplicates: count('duplicate'),
      exceptions: count('exception'),
      total: all.length,
      bank_total: Math.round(bankTotal * 100) / 100,
      internal_total: Math.round(internalTotal * 100) / 100,
      variance,
      status: variance === 0 ? 'BALANCED' : 'VARIANCE DETECTED',
      unmatched_bank: bankTxs.filter(t => t.status === 'unmatched').length,
      unmatched_internal: intTxs.filter(t => t.status === 'unmatched').length,
    };
  }
}

module.exports = ReconcileService;
