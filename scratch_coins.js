const { createClient } = require('@supabase/supabase-js');
global.WebSocket = require('ws'); // Fix for ws error
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) console.error(error);
  const user = users.users.find(u => u.email === 'test_guest_pingpong@test.com');
  if (user) {
    await supabase.from('user_profiles').update({ coins: 100 }).eq('id', user.id);
    console.log('Coins added to test_guest_pingpong@test.com');
  }
}
run();
