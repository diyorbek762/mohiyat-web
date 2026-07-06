require('dotenv').config({ path: '.env.local' });

async function bump() {
  console.log('Bumping coins for everyone...');
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?balance=gt.-1`, {
    method: 'PATCH',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ balance: 10 })
  });
  
  if (!res.ok) console.error(await res.text());
  else console.log('Done!');
}

bump();
