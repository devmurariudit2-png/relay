const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('Checking ticket_comments columns...');
  // We can't directly check schema with JS client easily, but we can try to insert and see the error or fetch a row
  const { data, error } = await supabase.from('ticket_comments').select('*').limit(1);
  if (error) {
    console.log('❌ Error fetching ticket_comments:', error.message);
  } else {
    console.log('✅ ticket_comments found:', data);
  }
}

checkSchema();
