const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
global.WebSocket = require('ws');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase.auth.admin.updateUserById(
    'af4bb52f-3f46-4aa4-9f3b-b950fa531b2f',
    { password: 'Uzcombinator2026!' }
  );
  if (error) console.error("Error setting password:", error);
  else console.log("Password updated successfully for", data.user.email);
}
main();
