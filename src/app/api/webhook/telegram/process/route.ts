import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendMessage(chatId: number, text: string, options: any = {}) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...options }),
  });
}

export async function POST(req: Request) {
  try {
    const { chatId, fileId, fileName, mimeType, userId } = await req.json();

    // 1. Get File Path from Telegram
    const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    if (!fileData.ok) {
       await sendMessage(chatId, `❌ Telegramdan faylni olishda xatolik yuz berdi. Fayl hajmi juda katta bo'lishi mumkin (Maks 20MB).`);
       return NextResponse.json({ error: "File get error" });
    }

    const filePath = fileData.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

    // 2. Download File
    const downloadRes = await fetch(fileUrl);
    const blob = await downloadRes.blob();
    const file = new File([blob], fileName, { type: mimeType });

    // 3. Send to our own API
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);

    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = req.headers.get('host');
    
    const scanRes = await fetch(`${protocol}://${host}/api/scan`, {
      method: "POST",
      headers: {
        "X-Server-Secret": process.env.SUPABASE_SERVICE_ROLE_KEY!
      },
      body: formData
    });

    const scanData = await scanRes.json();

    if (!scanRes.ok) {
       await sendMessage(chatId, `❌ <b>Tahlilda xatolik yuz berdi:</b>\n${scanData.detail || "Noma'lum xato"}`);
       return NextResponse.json({ error: scanData });
    }

    // 4. Send Results back to Telegram
    const scoreColor = scanData.risk_score >= 70 ? '🔴 Yuqori xavf' : scanData.risk_score >= 40 ? '🟡 O\'rta xavf' : '🟢 Past xavf';
    
    const resultText = `✅ <b>Tahlil yakunlandi!</b>\n\n` +
      `📊 <b>Mohiyat Score (Xavf darajasi):</b> ${scanData.risk_score}/100 (${scoreColor})\n\n` +
      `📝 <b>Qisqacha xulosa:</b>\n${scanData.summary?.substring(0, 300) || "Xulosa shakllantirilmadi"}...\n\n` +
      `To'liq hisobot va QR-sertifikatni ko'rish uchun quyidagi tugmani bosing:`;

    await sendMessage(chatId, resultText, {
       reply_markup: {
         inline_keyboard: [
           [{ text: "📄 To'liq hisobotni ko'rish", url: `https://mohiyat.vercel.app/results/${scanData.session_id}` }]
         ]
       }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Background processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
