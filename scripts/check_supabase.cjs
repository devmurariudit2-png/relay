const supabase = require('./config/supabase');
require('dotenv').config({ path: './.env' });

async function check() {
  const { data, error } = await supabase.from('profiles').select('*');
  console.log('Profiles:', data);
  if (error) console.error('Error:', error);
}
check();
