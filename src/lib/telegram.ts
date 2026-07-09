import { createClient } from "@supabase/supabase-js";

export async function sendTelegramNotification(userId: string, title: string, message: string, linkUrl: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("telegram_id")
      .eq("id", userId)
      .single();

    if (profile && profile.telegram_id) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mohiyatai.com";
      const fullMessage = `🔔 *${title}*\n\n${message}\n\nHujjatni ochish: ${appUrl}${linkUrl}`;
      
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chat_id: profile.telegram_id, 
          text: fullMessage,
          parse_mode: 'Markdown'
        })
      });
    }
  } catch (error) {
    console.error("Failed to send telegram notification:", error);
  }
}
