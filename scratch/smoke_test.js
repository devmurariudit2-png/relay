const dotenv = require('dotenv');
const path = require('path');
// Load env from backend
dotenv.config({ path: path.join(__dirname, '../Relay-main/.env') });

const supabase = require('../Relay-main/config/supabase');
const ListTransactionsService = require('../Relay-main/services/transactions/ListTransactionsService');
const ReconcileService = require('../Relay-main/services/transactions/ReconcileService');
const GetTransactionSummaryService = require('../Relay-main/services/transactions/GetTransactionSummaryService');

async function runSmokeTest() {
  console.log('🚀 Starting Relay Platform Smoke Test...\n');

  // 1. Connection Test
  const { data: health, error: healthErr } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
  if (healthErr) {
    console.error('❌ Connection Failed:', healthErr.message);
    process.exit(1);
  }
  console.log('✅ Supabase Connection: OK');

  // Find a test user
  const { data: user } = await supabase.from('profiles').select('id').limit(1).single();
  if (!user) {
    console.log('⚠️ No profiles found. Please ensure you have seeded the database.');
    return;
  }
  const testUserId = user.id;
  console.log('👤 Testing with User ID:', testUserId);

  const context = { user: { id: testUserId } };

  // 2. Test ListTransactionsService
  try {
    const result = await ListTransactionsService.execute({ limit: 5 }, context);
    console.log(`✅ ListTransactions: OK (Found ${result.txs.length} items)`);
  } catch (e) {
    console.error('❌ ListTransactions Failed:', e.message);
  }

  // 3. Test GetTransactionSummaryService
  try {
    const result = await GetTransactionSummaryService.execute({}, context);
    console.log(`✅ GetTransactionSummary: OK (Bank Balance: ${result.bank_balance})`);
  } catch (e) {
    console.error('❌ GetTransactionSummary Failed:', e.message);
  }

  // 4. Test ReconcileService
  try {
    console.log('🔄 Running Reconciliation Engine...');
    const result = await ReconcileService.execute({}, context);
    console.log(`✅ ReconcileService: OK (Status: ${result.status})`);
  } catch (e) {
    console.error('❌ ReconcileService Failed:', e.message);
  }

  console.log('\n✨ Smoke Test Complete!');
}

runSmokeTest();
