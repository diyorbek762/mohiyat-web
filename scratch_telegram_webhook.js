require('dotenv').config({ path: '.env.local' });

async function registerWebhook() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mohiyat.vercel.app";
  
  if (!botToken) {
    console.error("Please add TELEGRAM_BOT_TOKEN to .env.local first!");
    return;
  }

  const webhookUrl = `${appUrl}/api/webhook/telegram`;
  console.log(`Setting webhook to: ${webhookUrl}`);

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl })
    });
    
    const data = await res.json();
    console.log("Response:", data);
  } catch(e) {
    console.error(e);
  }
}

registerWebhook();
