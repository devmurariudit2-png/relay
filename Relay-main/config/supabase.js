const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:8000';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Supabase credentials missing. Supabase integration will use dummy credentials for tests.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
