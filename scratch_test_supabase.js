require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function test() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.d132a500-5309-4241-b5b3-69ad1083a6c3`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ telegram_id: 123456 })
  });
  
  const data = await res.text();
  fs.writeFileSync('supabase_error.json', JSON.stringify({ status: res.status, data }));
}
test();
