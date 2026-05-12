// Benchmark script.
const iterations = 5000;
const bank = [];
const internal = [];

for (let i = 0; i < iterations; i++) {
  const d = new Date(Date.now() - Math.random() * 86400000 * 5); // up to 5 days ago
  bank.push({ id: `b${i}`, amount: 100 + i, date: d.toISOString() });
  internal.push({ id: `i${i}`, amount: 100 + i, date: new Date(d.getTime() + 86400000).toISOString() }); // 1 day difference
}

const usedB = new Set();
const usedI = new Set();
const updates = [];

const start1 = Date.now();
// ── 4. Pass 2 — exact amount + date within 3 days ──────────────────────────
for (const b of bank) {
  if (usedB.has(b.id)) continue;
  const bd = new Date(b.date).getTime();
  for (const i of internal) {
    if (usedI.has(i.id)) continue;
    const dayDiff = Math.abs(new Date(i.date).getTime() - bd) / 86400000;
    if (Math.abs(i.amount - b.amount) < 0.01 && dayDiff <= 3) {
      usedB.add(b.id);
      usedI.add(i.id);
      break;
    }
  }
}
const time1 = Date.now() - start1;
console.log('O(N^2) took', time1, 'ms, matched:', usedB.size);

usedB.clear();
usedI.clear();

const start2 = Date.now();
// ── 4. Pass 2 — exact amount + date within 3 days ──────────────────────────
const internalByAmount = new Map();
for (const i of internal) {
  if (usedI.has(i.id)) continue;
  const amountKey = Math.round(i.amount * 100);
  i._ts = new Date(i.date).getTime();
  if (!internalByAmount.has(amountKey)) internalByAmount.set(amountKey, []);
  internalByAmount.get(amountKey).push(i);
}

for (const b of bank) {
  if (usedB.has(b.id)) continue;
  const bd = new Date(b.date).getTime();
  const amountKey = Math.round(b.amount * 100);

  const candidateKeys = [amountKey - 1, amountKey, amountKey + 1];
  let matched = false;

  for (const key of candidateKeys) {
    if (matched) break;
    const candidates = internalByAmount.get(key);
    if (!candidates) continue;

    for (const i of candidates) {
      if (usedI.has(i.id)) continue;

      const dayDiff = Math.abs(i._ts - bd) / 86400000;
      if (Math.abs(i.amount - b.amount) < 0.01 && dayDiff <= 3) {
        usedB.add(b.id);
        usedI.add(i.id);
        matched = true;
        break;
      }
    }
  }
}
const time2 = Date.now() - start2;
console.log('O(N) with Map took', time2, 'ms, matched:', usedB.size);
