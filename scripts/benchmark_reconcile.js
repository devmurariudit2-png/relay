
const TRANSACTIONS_COUNT = 100;
const SIMULATED_LATENCY_MS = 5; // 5ms simulated latency per DB request

const mockTransaction = {
  findByIdAndUpdate: async (id, update) => {
    // Simulate network roundtrip and DB processing
    await new Promise(resolve => setTimeout(resolve, SIMULATED_LATENCY_MS));
    return { _id: id, ...update };
  },
  bulkWrite: async (operations) => {
    // Simulate a single network roundtrip and DB processing for the batch
    // Bulk operations are usually faster than sequential but still take some time
    // We'll simulate it as one roundtrip regardless of the number of operations
    await new Promise(resolve => setTimeout(resolve, SIMULATED_LATENCY_MS));
    return { nMatched: operations.length, nModified: operations.length };
  }
};

async function runSequential(updates) {
  const start = Date.now();
  for (const u of updates) {
    await mockTransaction.findByIdAndUpdate(u.id, {
      $set: { status: u.status, matched_id: u.matched_id }
    });
  }
  return Date.now() - start;
}

async function runBulk(updates) {
  const start = Date.now();
  if (updates.length > 0) {
    const ops = updates.map(u => ({
      updateOne: {
        filter: { _id: u.id },
        update: { $set: { status: u.status, matched_id: u.matched_id } }
      }
    }));
    await mockTransaction.bulkWrite(ops);
  }
  return Date.now() - start;
}

async function runBenchmark() {
  const updates = Array.from({ length: TRANSACTIONS_COUNT }, (_, i) => ({
    id: `id_${i}`,
    status: 'matched',
    matched_id: `matched_${i}`
  }));

  console.log(`Running benchmark with ${TRANSACTIONS_COUNT} updates and ${SIMULATED_LATENCY_MS}ms simulated latency...`);

  const sequentialTime = await runSequential(updates);
  console.log(`Sequential Updates Time: ${sequentialTime}ms`);

  const bulkTime = await runBulk(updates);
  console.log(`Bulk Updates Time: ${bulkTime}ms`);

  const improvement = ((sequentialTime - bulkTime) / sequentialTime * 100).toFixed(2);
  console.log(`Improvement: ${improvement}%`);
}

runBenchmark().catch(console.error);
