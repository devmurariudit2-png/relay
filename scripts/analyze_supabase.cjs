const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyze() {
  console.log('--- SUPABASE ANALYSIS ---');
  
  // 1. Check Tables
  const { data: tables, error: tableError } = await supabase.rpc('get_tables_info'); // Might not exist
  if (tableError) {
    console.log('RPC get_tables_info not found, falling back to manual check...');
    const tableNames = ['profiles', 'transactions', 'tickets', 'ticket_comments', 'audit_logs'];
    for (const name of tableNames) {
      const { error, count } = await supabase.from(name).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`[TABLE] ${name}: MISSING or ERROR (${error.message})`);
      } else {
        console.log(`[TABLE] ${name}: OK (Row count: ${count})`);
      }
    }
  }

  // 2. Check Auth Users
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.log('[AUTH] Error listing users:', userError.message);
  } else {
    console.log(`[AUTH] Users count: ${users.users.length}`);
    users.users.forEach(u => console.log(` - ${u.email} (${u.id})`));
  }

  // 3. Check for RPCs or specific functions
  console.log('--- END ANALYSIS ---');
}

analyze();
