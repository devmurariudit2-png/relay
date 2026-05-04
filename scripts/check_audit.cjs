const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAudit() {
  const { data, error } = await supabase.from('audit_logs').select('*').limit(1);
  if (error) console.log('Audit Logs Error:', error.message);
  else console.log('Audit Logs OK');
}
checkAudit();
