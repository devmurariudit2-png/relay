const bank = [];
const internal = [];

// Generate 5000 bank and 5000 internal transactions
for (let i = 0; i < 5000; i++) {
  bank.push({
    id: `b_${i}`,
    amount: Math.random() * 1000,
    date: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
  });
  internal.push({
    id: `i_${i}`,
    amount: Math.random() * 1000,
    date: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
  });
}

function runOld() {
  const updates = [];
  const usedB = new Set();
  const usedI = new Set();

  const start = performance.now();
  for (const b of bank) {
    if (usedB.has(b.id)) continue;
    const bd = new Date(b.date).getTime();
    for (const i of internal) {
      if (usedI.has(i.id)) continue;
      const dayDiff = Math.abs(new Date(i.date).getTime() - bd) / 86400000;
      if (Math.abs(i.amount - b.amount) < 0.01 && dayDiff <= 3) {
        updates.push({ id: b.id, matched_id: i.id });
        usedB.add(b.id);
        usedI.add(i.id);
        break;
      }
    }
  }
  const end = performance.now();
  return end - start;
}

function runNew() {
  const updates = [];
  const usedB = new Set();
  const usedI = new Set();

  const start = performance.now();
  const internalByAmount = new Map();
  for (const i of internal) {
    if (usedI.has(i.id)) continue;
    const amtKey = Math.round(i.amount * 100);
    if (!internalByAmount.has(amtKey)) internalByAmount.set(amtKey, []);
    internalByAmount.get(amtKey).push(i);
  }

  for (const b of bank) {
    if (usedB.has(b.id)) continue;
    const amtKey = Math.round(b.amount * 100);

    const candidates = [
      ...(internalByAmount.get(amtKey) || []),
      ...(internalByAmount.get(amtKey - 1) || []),
      ...(internalByAmount.get(amtKey + 1) || [])
    ];

    if (candidates.length === 0) continue;

    const bd = new Date(b.date).getTime();
    for (const i of candidates) {
      if (usedI.has(i.id)) continue;
      const dayDiff = Math.abs(new Date(i.date).getTime() - bd) / 86400000;
      if (Math.abs(i.amount - b.amount) < 0.01 && dayDiff <= 3) {
        updates.push({ id: b.id, matched_id: i.id });
        usedB.add(b.id);
        usedI.add(i.id);
        break;
      }
    }
  }
  const end = performance.now();
  return end - start;
}

console.log("Old O(N^2) time:", runOld().toFixed(2), "ms");
console.log("New O(N) time:  ", runNew().toFixed(2), "ms");
