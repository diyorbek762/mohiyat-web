const { createClient } = require('@supabase/supabase-js');
global.WebSocket = require('ws');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { count, error } = await supabase.from('legal_knowledge').select('*', { count: 'exact', head: true });
  console.log("Ingested chunks:", count);
  if (error) console.error("Error:", error);
}
run();
