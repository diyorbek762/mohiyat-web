const { createClient } = require('@supabase/supabase-js');
global.WebSocket = require('ws'); 
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'test_guest_pingpong@test.com');
  if (user) {
    await supabase.from('scan_sessions').update({ user_id: user.id }).eq('id', '7f8b735d-08bf-4e95-8aae-6ba14dc4e6f9');
    console.log('Session assigned');
    // Also delete any existing negotiation rooms for this session so we can start fresh
    await supabase.from('negotiation_rooms').delete().eq('session_id', '7f8b735d-08bf-4e95-8aae-6ba14dc4e6f9');
    console.log('Old rooms deleted');
  }
}
run();
