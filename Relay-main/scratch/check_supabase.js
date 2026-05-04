const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function check() {
  console.log('Checking Supabase connection...');
  console.log('URL:', process.env.SUPABASE_URL);

  const tables = ['profiles', 'transactions', 'audit_logs', 'tickets', 'subscriptions', 'stripe_events', 'ticket_comments'];

  for (const table of tables) {
    const { data, count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ Table "${table}": Error - ${error.message}`);
    } else {
      console.log(`✅ Table "${table}": Success - ${count} rows found`);
    }
  }
}

check();
