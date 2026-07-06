require('dotenv').config({ path: '.env.local' });
const { spawn } = require('child_process');
const fetch = require('node-fetch');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error('[-] TELEGRAM_BOT_TOKEN is missing in .env.local');
  process.exit(1);
}
const cleanToken = TOKEN.replace(/"/g, '').replace(/'/g, '');

console.log('[+] Starting secure tunnel via Cloudflare...');

const tunnel = spawn('npx', [
  'cloudflared',
  'tunnel',
  '--url',
  'http://localhost:3000'
]);

let urlFound = false;

// Cloudflared outputs URLs to stderr
tunnel.stderr.on('data', async (data) => {
  const output = data.toString();
  
  // Look for the https URL in cloudflared output
  const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match && !urlFound) {
    urlFound = true;
    const tunnelUrl = match[0];
    console.log(`\n[+] Tunnel URL: ${tunnelUrl}`);
    
    const webhookUrl = `${tunnelUrl}/api/webhook/telegram`;
    console.log(`[+] Setting webhook to: ${webhookUrl}`);
    
    console.log(`[+] Waiting 5 seconds for Cloudflare DNS to propagate...`);
    
    setTimeout(async () => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${cleanToken}/setWebhook?url=${webhookUrl}`);
        const data = await res.json();
        if (data.ok) {
          console.log('[+] Webhook successfully set! You can test your bot now.');
        } else {
          console.error('[-] Failed to set webhook:', data);
        }
      } catch (e) {
        console.error('[-] Error setting webhook:', e);
      }
    }, 5000);
  }
});

tunnel.on('close', (code) => {
  console.log(`[-] Tunnel closed with code ${code}`);
});
