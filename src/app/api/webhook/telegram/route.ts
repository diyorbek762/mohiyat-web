import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Check if it's a valid message
    if (!body.message || !body.message.text) {
      return NextResponse.json({ success: true }); // Acknowledge non-text messages
    }

    const chatId = body.message.chat.id;
    const text = body.message.text.trim();
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN is not configured.");
      return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Helper function to send Telegram message
    const sendMessage = async (chatId: number, text: string) => {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text })
      });
    };

    if (text.startsWith("/start ")) {
      const token = text.split(" ")[1];
      
      // We expect the token to be the user's Supabase UUID for now
      // In a strict production environment, we should use a one-time random token
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      
      if (uuidRegex.test(token)) {
        // Link Telegram ID to Profile
        const { error } = await supabase
          .from('profiles')
          .update({ telegram_id: chatId })
          .eq('id', token);

        if (!error) {
          await sendMessage(chatId, "✅ Hisobingiz muvaffaqiyatli ulandi! Endi qonunchilikdagi o'zgarishlar haqida shu yerda xabardor qilib boraman.");
        } else {
          console.error("Error linking telegram:", error);
          await sendMessage(chatId, `❌ Xatolik yuz berdi: ${error.message || JSON.stringify(error)}`);
        }
      } else {
        await sendMessage(chatId, "❌ Noto'g'ri faollashtirish kodi.");
      }
    } else if (text === "/start") {
      await sendMessage(chatId, "👋 Mohiyat AI botiga xush kelibsiz! Botni faollashtirish uchun platformamizdagi maxsus ssilka orqali o'ting.");
    } else {
      // Ignore other commands to preserve privacy
      await sendMessage(chatId, "Barcha bildirishnomalar avtomatik tarzda keladi. Siz bu yerda hech narsa yozishingiz shart emas.");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Telegram Webhook Error:", error);
    // Telegram will retry if we return 500, but usually we just want to ack
    return NextResponse.json({ success: true }, { status: 200 }); 
  }
}
