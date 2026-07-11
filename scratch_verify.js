const { createClient } = require('@supabase/supabase-js');
global.WebSocket = require('ws'); 
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: rooms } = await supabase.from('negotiation_rooms').select('*').eq('session_id', '7f8b735d-08bf-4e95-8aae-6ba14dc4e6f9');
  if (rooms && rooms.length > 0) {
    console.log("Status:", rooms[0].status);
    console.log("Demands:", JSON.stringify(rooms[0].demands, null, 2));
    console.log("Responses:", JSON.stringify(rooms[0].responses, null, 2));
  }
}
run();
