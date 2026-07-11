const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('scan_sessions').select('id, user_id, status, org_id').limit(5);
  console.log("Sessions:", data);
  console.log("Error:", error);
}
check();
