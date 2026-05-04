const Transaction = require('../models/Transaction');

const reconcile = async (userId) => {

  // ── 1. Reset all to pending ───────────────────────────────────────────────
  await Transaction.updateMany(
    { user: userId },
    { $set: { status: 'pending', matched_id: null } }
  );

  const bank = await Transaction.find({ user: userId, source: 'bank' }).lean();
  const internal = await Transaction.find({ user: userId, source: 'internal' }).lean();

  const usedB = new Set();
  const usedI = new Set();
  const bulkOps = [];

  // ── 2. Pass 1 — Exact Reference + Exact Amount (O(N) with Hash Map) ───────
  const internalByRef = new Map();
  for (const i of internal) {
    if (!i.reference) continue;
    if (!internalByRef.has(i.reference)) internalByRef.set(i.reference, []);
    internalByRef.get(i.reference).push(i);
  }

  for (const b of bank) {
    if (!b.reference || usedB.has(String(b._id))) continue;
    const candidates = internalByRef.get(b.reference);
    if (!candidates) continue;

    for (const i of candidates) {
      if (usedI.has(String(i._id))) continue;
      if (Math.abs(i.amount - b.amount) < 0.01) {
        bulkOps.push({ updateOne: { filter: { _id: b._id }, update: { $set: { status: 'matched', matched_id: i._id } } } });
        bulkOps.push({ updateOne: { filter: { _id: i._id }, update: { $set: { status: 'matched', matched_id: b._id } } } });
        usedB.add(String(b._id));
        usedI.add(String(i._id));
        break;
      }
    }
  }

  // ── 3. Pass 2 — Exact Amount + Date within 3 days (O(N) with Hash Map) ────
  const internalByAmt = new Map();
  for (const i of internal) {
    if (usedI.has(String(i._id))) continue;
    const amtKey = Math.round(i.amount * 100);
    if (!internalByAmt.has(amtKey)) internalByAmt.set(amtKey, []);
    internalByAmt.get(amtKey).push(i);
  }

  for (const b of bank) {
    if (usedB.has(String(b._id))) continue;
    const bd = new Date(b.date).getTime();
    const amtKey = Math.round(b.amount * 100);
    const candidates = internalByAmt.get(amtKey);
    
    if (!candidates) continue;

    for (const i of candidates) {
      if (usedI.has(String(i._id))) continue;
      const dayDiff = Math.abs(new Date(i.date).getTime() - bd) / 86400000;
      if (dayDiff <= 3) {
        bulkOps.push({ updateOne: { filter: { _id: b._id }, update: { $set: { status: 'matched', matched_id: i._id } } } });
        bulkOps.push({ updateOne: { filter: { _id: i._id }, update: { $set: { status: 'matched', matched_id: b._id } } } });
        usedB.add(String(b._id));
        usedI.add(String(i._id));
        break;
      }
    }
  }

  // ── 4. Detect Duplicates (O(N) with Hash Map) ─────────────────────────────
  const pending = await Transaction.find({ user: userId, status: 'pending' }).lean();
  const duplicateIds = new Set();
  
  const duplicateMap = new Map();
  for (const t of pending) {
    if (usedB.has(String(t._id)) || usedI.has(String(t._id))) continue; // Skip newly matched
    const key = `${t.source}_${Math.round(t.amount * 100)}_${t.reference || ''}`;
    if (!duplicateMap.has(key)) {
      duplicateMap.set(key, [t]);
    } else {
      const candidates = duplicateMap.get(key);
      let isDuplicate = false;
      for (const existing of candidates) {
         const closeDate = Math.abs(new Date(t.date).getTime() - new Date(existing.date).getTime()) / 86400000 <= 1;
         if (closeDate) {
            duplicateIds.add(String(t._id));
            isDuplicate = true;
            break;
         }
      }
      if (!isDuplicate) candidates.push(t);
    }
  }

  if (duplicateIds.size > 0) {
    bulkOps.push({
      updateMany: {
        filter: { _id: { $in: Array.from(duplicateIds) } },
        update: { $set: { status: 'duplicate' } }
      }
    });
  }

  // ── 5. Detect Exceptions (Over 10,000 threshold) ─────────────────────────
  const EXCEPTION_THRESHOLD = 10000;
  bulkOps.push({
    updateMany: {
      filter: { user: userId, status: 'pending', amount: { $gte: EXCEPTION_THRESHOLD }, _id: { $nin: Array.from(duplicateIds) } },
      update: { $set: { status: 'exception' } }
    }
  });
  bulkOps.push({
    updateMany: {
      filter: { user: userId, status: 'pending', amount: { $lte: -EXCEPTION_THRESHOLD }, _id: { $nin: Array.from(duplicateIds) } },
      update: { $set: { status: 'exception' } }
    }
  });

  // ── 6. Everything Else is Unmatched ──────────────────────────────────────
  bulkOps.push({
    updateMany: {
      filter: { user: userId, status: 'pending', amount: { $gt: -EXCEPTION_THRESHOLD, $lt: EXCEPTION_THRESHOLD }, _id: { $nin: Array.from(duplicateIds) } },
      update: { $set: { status: 'unmatched' } }
    }
  });

  // ── 7. Execute all operations in one batch ───────────────────────────────
  if (bulkOps.length > 0) {
    await Transaction.bulkWrite(bulkOps);
  }

  // ── 8. Calculate Summary (Database Aggregation, No Memory Overhead) ──────
  const aggResult = await Transaction.aggregate([
    { $match: { user: userId } },
    { $group: {
        _id: null,
        total: { $sum: 1 },
        matched: { $sum: { $cond: [{ $eq: ["$status", "matched"] }, 1, 0] } },
        unmatched: { $sum: { $cond: [{ $eq: ["$status", "unmatched"] }, 1, 0] } },
        duplicates: { $sum: { $cond: [{ $eq: ["$status", "duplicate"] }, 1, 0] } },
        exceptions: { $sum: { $cond: [{ $eq: ["$status", "exception"] }, 1, 0] } },
        bank_total: { $sum: { $cond: [{ $eq: ["$source", "bank"] }, "$amount", 0] } },
        internal_total: { $sum: { $cond: [{ $eq: ["$source", "internal"] }, "$amount", 0] } },
        unmatched_bank: { $sum: { $cond: [{ $and: [{ $eq: ["$source", "bank"] }, { $eq: ["$status", "unmatched"] }] }, 1, 0] } },
        unmatched_internal: { $sum: { $cond: [{ $and: [{ $eq: ["$source", "internal"] }, { $eq: ["$status", "unmatched"] }] }, 1, 0] } }
    }}
  ]);

  const stats = aggResult[0] || {
    matched: 0, unmatched: 0, duplicates: 0, exceptions: 0, total: 0,
    bank_total: 0, internal_total: 0, unmatched_bank: 0, unmatched_internal: 0
  };

  const bankTotal = Math.round(stats.bank_total * 100) / 100;
  const internalTotal = Math.round(stats.internal_total * 100) / 100;
  const variance = Math.round((bankTotal - internalTotal) * 100) / 100;

  return {
    matched: stats.matched,
    unmatched: stats.unmatched,
    duplicates: stats.duplicates,
    exceptions: stats.exceptions,
    total: stats.total,
    bank_total: bankTotal,
    internal_total: internalTotal,
    variance,
    status: variance === 0 ? 'BALANCED' : 'VARIANCE DETECTED',
    unmatched_bank: stats.unmatched_bank,
    unmatched_internal: stats.unmatched_internal
  };
};

module.exports = reconcile;