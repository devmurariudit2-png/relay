/**
 * Pure Reconciliation Engine
 * Decoupled from database for testing purposes.
 */

const reconcile = (bank, internal) => {
  const usedB = new Set();
  const usedI = new Set();
  const matches = [];

  // 1. Pass 1 — Exact Reference + Exact Amount
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
        matches.push({ bankId: b.id, internalId: i.id });
        usedB.add(b.id);
        usedI.add(i.id);
        break;
      }
    }
  }

  // 2. Pass 2 — Exact Amount + Date within 3 days
  // ⚡ Bolt: Optimized O(N^2) loop to O(N) using a Map for pre-grouping internal transactions by amount
  const internalByAmt = new Map();
  for (const i of internal) {
    if (usedI.has(i.id)) continue;
    const key = Math.round(i.amount * 100);
    if (!internalByAmt.has(key)) internalByAmt.set(key, []);
    internalByAmt.get(key).push(i);
  }

  for (const b of bank) {
    if (usedB.has(b.id)) continue;
    const bd = new Date(b.date).getTime();
    const bKey = Math.round(b.amount * 100);

    const candidates = [
      ...(internalByAmt.get(bKey - 1) || []),
      ...(internalByAmt.get(bKey) || []),
      ...(internalByAmt.get(bKey + 1) || [])
    ];

    for (const i of candidates) {
      if (usedI.has(i.id)) continue;
      const dayDiff = Math.abs(new Date(i.date).getTime() - bd) / 86400000;
      if (Math.abs(i.amount - b.amount) < 0.01 && dayDiff <= 3) {
        matches.push({ bankId: b.id, internalId: i.id });
        usedB.add(b.id);
        usedI.add(i.id);
        break;
      }
    }
  }

  // 3. Detect Duplicates
  const duplicateIds = new Set();
  const detectDuplicates = (list) => {
    const map = new Map();
    for (const t of list) {
      if (usedB.has(t.id) || usedI.has(t.id)) continue;
      const key = `${t.source}_${Math.round(t.amount * 100)}_${t.reference || ''}`;
      if (!map.has(key)) {
        map.set(key, [t]);
      } else {
        const existing = map.get(key);
        for (const e of existing) {
          if (Math.abs(new Date(t.date).getTime() - new Date(e.date).getTime()) / 86400000 <= 1) {
            duplicateIds.add(t.id);
            break;
          }
        }
        existing.push(t);
      }
    }
  };
  detectDuplicates(bank);
  detectDuplicates(internal);

  // 4. Identify Exceptions (Threshold 10,000)
  const THRESHOLD = 10000;
  const exceptionIds = new Set();
  [...bank, ...internal].forEach(t => {
    if (!usedB.has(t.id) && !usedI.has(t.id) && !duplicateIds.has(t.id)) {
      if (Math.abs(t.amount) >= THRESHOLD) {
        exceptionIds.add(t.id);
      }
    }
  });

  return {
    matches,
    duplicateIds: Array.from(duplicateIds),
    exceptionIds: Array.from(exceptionIds),
    unmatchedIds: [...bank, ...internal]
      .map(t => t.id)
      .filter(id => !usedB.has(id) && !usedI.has(id) && !duplicateIds.has(id) && !exceptionIds.has(id))
  };
};

module.exports = { reconcile };
