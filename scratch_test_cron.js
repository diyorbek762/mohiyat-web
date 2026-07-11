require('dotenv').config({ path: '.env.local' });

async function testCron() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("Fetching the user's profile who has a Telegram ID connected...");
  let res = await fetch(`${url}/rest/v1/profiles?telegram_id=not.is.null&select=id,telegram_id&limit=1`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  let profiles = await res.json();

  if (!profiles || profiles.length === 0) {
    console.error("No user found with a connected Telegram ID.");
    return;
  }
  
  const user = profiles[0];
  console.log("User found:", user.id);

  console.log("Setting up a dummy scan_session with a 3-day deadline...");
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  
  // Create dummy session
  res = await fetch(`${url}/rest/v1/scan_sessions`, {
    method: 'POST',
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify({
      user_id: user.id,
      file_name: "test_shartnoma.pdf",
      short_title: "Test B2B Shartnoma",
      crm_deadline: threeDaysFromNow,
      crm_amount: 50000000,
      crm_currency: "UZS",
      crm_counterparty: "Test MChJ",
      full_report: {}
    })
  });
  
  if (!res.ok) {
    console.error("Failed to create dummy session", await res.text());
    return;
  }
  const newSession = await res.json();
  console.log("Dummy session prepared. Now triggering the Cron Job via HTTP...");
  
  const appUrl = "https://mohiyat.vercel.app";
  const cronSecret = process.env.CRON_SECRET || "";
  
  console.log(`Sending GET request to ${appUrl}/api/cron/check-deadlines ...`);
  try {
    const cronRes = await fetch(`${appUrl}/api/cron/check-deadlines`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${cronSecret}`
      }
    });
    
    const data = await cronRes.json();
    console.log("Cron Response:", data);
    console.log("Check your Telegram! You should have received a notification.");
  } catch(e) {
    console.error("Fetch failed:", e.message);
  }
}

testCron();
