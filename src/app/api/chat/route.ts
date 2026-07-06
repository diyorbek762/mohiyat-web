import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const maxDuration = 60;

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const ratelimit = (redisUrl && redisToken)
  ? new Ratelimit({
      redis: new Redis({ url: redisUrl, token: redisToken }),
      limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 messages per minute
      analytics: true,
    })
  : null;

export async function POST(req: NextRequest) {
  try {
    if (ratelimit) {
      const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "127.0.0.1";
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json({ error: "Juda ko'p xabar yuborildi." }, { status: 429 });
      }
    }

    const { session_id, message } = await req.json();

    if (!session_id || !message) {
      return NextResponse.json({ error: "Xabar kiritilmagan" }, { status: 400 });
    }

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: userResp, error: userErr } = await authSupabase.auth.getUser();
    if (userErr || !userResp?.user) {
      return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 401 });
    }
    const userId = userResp.user.id;

    // Fetch the scan session to provide context
    const { data: scanSession, error: scanErr } = await authSupabase
      .from('scan_sessions')
      .select('full_report, raw_text')
      .eq('id', session_id)
      .eq('user_id', userId)
      .single();

    if (scanErr || !scanSession) {
      return NextResponse.json({ error: "Tahlil seansi topilmadi" }, { status: 404 });
    }

    // Save user message to DB
    await authSupabase.from('chat_messages').insert({
      session_id,
      user_id: userId,
      role: 'user',
      content: message
    });

    // Fetch previous chat history
    const { data: chatHistory } = await authSupabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(10); // get last 10 messages

    // Format messages for OpenAI
    const aiMessages: any[] = [
      { 
        role: "system", 
        content: `Siz O'zbekiston qonunchiligiga ixtisoslashgan professional yuridik yordamchi - "Mohiyat AI"siz.
Foydalanuvchi quyidagi shartnoma bo'yicha savol beryapti. Qisqa, aniq va huquqiy asoslangan javob bering.

Shartnoma Tahlil Natijalari (Kontekst):
${JSON.stringify(scanSession.full_report)}` 
      }
    ];

    if (chatHistory) {
      chatHistory.forEach(msg => aiMessages.push({ role: msg.role, content: msg.content }));
    }

    // AI Generation
    let aiResponseText = "";
    try {
      const response = await openrouter.chat.completions.create({
        model: "openrouter/free", // fast chat model
        messages: aiMessages,
      });
      aiResponseText = response.choices[0].message.content || "";
    } catch (e: any) {
      try {
        const fallbackResp = await openrouter.chat.completions.create({
          model: "google/gemma-4-31b-it:free",
          messages: aiMessages,
        });
        aiResponseText = fallbackResp.choices[0].message.content || "";
      } catch (e2: any) {
        throw new Error("AI ulanishida uzilish.");
      }
    }

    if (!aiResponseText) throw new Error("AI javob qaytarmadi.");

    // Save AI response to DB
    await authSupabase.from('chat_messages').insert({
      session_id,
      user_id: userId,
      role: 'assistant',
      content: aiResponseText
    });

    return NextResponse.json({ success: true, response: aiResponseText });

  } catch (err: any) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: err.message || "Xatolik yuz berdi" }, { status: 500 });
  }
}
