const BaseService = require('../BaseService');
const supabase = require('../../config/supabase');

class ReconcileService extends BaseService {
  async run() {
    const userId = this.userId;
    if (!userId) throw new Error("User ID is required for reconciliation");

    // ── 1. Reset all user transactions to pending ──────────────────────────────
    await supabase.from('transactions')
      .update({ status: 'pending', matched_id: null })
      .eq('user_id', userId);

    // ── 2. Fetch all transactions ──────────────────────────────────────────────
    const { data: allTx, error } = await supabase.from('transactions')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    if (!allTx || allTx.length === 0) {
      return { matched: 0, unmatched: 0, duplicates: 0, exceptions: 0, total: 0, bank_total: 0, internal_total: 0, variance: 0, status: 'BALANCED', unmatched_bank: 0, unmatched_internal: 0 };
    }

    const bank = allTx.filter(t => t.source === 'bank');
    const internal = allTx.filter(t => t.source === 'internal');
    const usedB = new Set();
    const usedI = new Set();
    const updates = []; // { id, status, matched_id }

    // ── 3. Pass 1 — exact reference + exact amount ─────────────────────────────
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

    // ── 4. Pass 2 — exact amount + date within 3 days ──────────────────────────
    // Optimized: O(N) lookup by pre-grouping internal transactions by amount
    const internalByAmount = new Map();
    for (const i of internal) {
      if (usedI.has(i.id)) continue;
      const amtKey = Math.round(i.amount * 100);
      if (!internalByAmount.has(amtKey)) internalByAmount.set(amtKey, []);
      internalByAmount.get(amtKey).push(i);
    }

    for (const b of bank) {
      if (usedB.has(b.id)) continue;
      const bd = new Date(b.date).getTime();
      const amtKey = Math.round(b.amount * 100);

      let matched = false;
      // Check key-1, key, and key+1 to handle boundaries like 100.004 vs 100.006 (diff < 0.01 but keys 10000 and 10001)
      for (const key of [amtKey - 1, amtKey, amtKey + 1]) {
        const candidates = internalByAmount.get(key);
        if (!candidates) continue;

        for (const i of candidates) {
          if (usedI.has(i.id)) continue;
          const dayDiff = Math.abs(new Date(i.date).getTime() - bd) / 86400000;
          if (Math.abs(i.amount - b.amount) < 0.01 && dayDiff <= 3) {
            updates.push({ id: b.id, status: 'matched', matched_id: i.id });
            updates.push({ id: i.id, status: 'matched', matched_id: b.id });
            usedB.add(b.id);
            usedI.add(i.id);
            matched = true;
            break; // Break candidates loop
          }
        }
        if (matched) break; // Break keys loop
      }
    }

    // ── 5. Apply matched updates in a single bulk operation ───────────────────
    if (updates.length > 0) {
      const { error: updateError } = await supabase
        .from('transactions')
        .upsert(updates.map(u => ({ 
          id: u.id, 
          status: u.status, 
          matched_id: u.matched_id,
          user_id: userId // Required for RLS or index matching usually
        })));
      
      if (updateError) throw updateError;
    }

    // ── 6. Detect duplicates ───────────────────────────────────────────────────
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
    if (duplicateIds.size > 0) {
      await supabase.from('transactions').update({ status: 'duplicate' }).in('id', [...duplicateIds]);
    }

    // ── 7. Flag exceptions (>= 10,000) ──────────────────────────────────────────
    const THRESHOLD = 10000;
    const exceptionIds = pending.filter(t => !duplicateIds.has(t.id) && Math.abs(t.amount) >= THRESHOLD).map(t => t.id);
    if (exceptionIds.length > 0) {
      await supabase.from('transactions').update({ status: 'exception' }).in('id', exceptionIds);
    }

    // ── 8. Everything else → unmatched ─────────────────────────────────────────
    const unmatchedIds = pending.filter(t => !duplicateIds.has(t.id) && !exceptionIds.includes(t.id)).map(t => t.id);
    if (unmatchedIds.length > 0) {
      await supabase.from('transactions').update({ status: 'unmatched' }).in('id', unmatchedIds);
    }

    // ── 9. Final Summary ───────────────────────────────────────────────────────
    const { data: final } = await supabase.from('transactions').select('*').eq('user_id', userId);
    const bankTxs = final.filter(t => t.source === 'bank');
    const intTxs = final.filter(t => t.source === 'internal');
    const bankTotal = Math.round(bankTxs.reduce((s, t) => s + t.amount, 0) * 100) / 100;
    const internalTotal = Math.round(intTxs.reduce((s, t) => s + t.amount, 0) * 100) / 100;
    const variance = Math.round((bankTotal - internalTotal) * 100) / 100;
    const countByStatus = (st) => final.filter(t => t.status === st).length;

    return {
      matched: countByStatus('matched'),
      unmatched: countByStatus('unmatched'),
      duplicates: countByStatus('duplicate'),
      exceptions: countByStatus('exception'),
      total: final.length,
      bank_total: bankTotal,
      internal_total: internalTotal,
      variance,
      status: variance === 0 ? 'BALANCED' : 'VARIANCE DETECTED',
      unmatched_bank: bankTxs.filter(t => t.status === 'unmatched').length,
      unmatched_internal: intTxs.filter(t => t.status === 'unmatched').length,
    };
  }
}

module.exports = ReconcileService;
