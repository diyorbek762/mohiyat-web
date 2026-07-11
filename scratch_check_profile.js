require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from('profiles')
    .select('telegram_id')
    .limit(1);

  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log("Success, telegram_id exists:", data);
  }
}
test();
