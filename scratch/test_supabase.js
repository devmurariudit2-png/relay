const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './Relay-main/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseServiceKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
      console.error('Error fetching profiles:', error);
    } else {
      console.log('Success! Data:', data);
    }
  } catch (err) {
    console.error('Catch error:', err);
  }
}

test();
