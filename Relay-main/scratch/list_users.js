const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listUsers() {
  const { data: users, error } = await supabase.from('profiles').select('email, full_name, role');
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Users in database:');
    users.forEach(u => console.log(`- ${u.email} (${u.full_name}) [${u.role}]`));
  }
}

listUsers();
