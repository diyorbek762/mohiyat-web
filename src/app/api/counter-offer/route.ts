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
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
    })
  : null;

export async function POST(req: NextRequest) {
  try {
    if (ratelimit) {
      const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "127.0.0.1";
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json({ error: "Juda ko'p so'rov yuborildi." }, { status: 429 });
      }
    }

    const { session_id, selected_risks, tone, user_name } = await req.json();

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

    // Get user session to verify balance (Counter-Offer costs 3 coins)
    const { data: userResp, error: userErr } = await authSupabase.auth.getUser();
    if (userErr || !userResp?.user) {
      return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 401 });
    }

    const { data: profile } = await authSupabase.from('profiles').select('balance').eq('id', userResp.user.id).single();
    if (!profile || profile.balance < 3) {
      return NextResponse.json({ error: "Hisobingizda yetarli Coin yo'q (Ushbu xizmat 3 Coin turadi)" }, { status: 402 });
    }

    // Fetch the scan session to understand the context
    const { data: scanSession, error: scanErr } = await authSupabase
      .from('scan_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', userResp.user.id)
      .single();

    if (scanErr || !scanSession) {
      return NextResponse.json({ error: "Tahlil seansi topilmadi" }, { status: 404 });
    }

    // Find the specific risks from the full_report
    const allRisks = scanSession.full_report?.blind_spots || [];
    const targetRisks = allRisks.filter((r: any) => selected_risks.includes(r.title));

    if (targetRisks.length === 0) {
      return NextResponse.json({ error: "Tanlangan xavflar topilmadi" }, { status: 400 });
    }

    const risksText = targetRisks.map((r: any) => `- **${r.title}**: ${r.recommendation}`).join("\n");

    const systemPrompt = `Siz professional korporativ yurist sifatida foydalanuvchi nomidan ish ko'ryapsiz.
SIZNING YAGONA VAZIFANGIZ — SHARTNOMANING IKKINCHI TARAFIGA TO'G'RIDAN-TO'G'RI YUBORILADIGAN "QARSHI TAKLIF" (COUNTER-OFFER) XATINI YOZISH.
MAQOLA, QO'LLANMA YOKI TUSHUNTIRISH YOZMANG. FAQAT XATNING O'ZINI YOZING!
XAT FAQAT VA FAQAT O'ZBEK TILIDA BO'LISHI SHART!

Xat ohangi (Tone): ${tone === 'aggressive' ? "Qat'iy va himoyalangan" : tone === 'friendly' ? "Do'stona, kompromissga tayyor" : "Professional va qonuniy"}.
Foydalanuvchi (Xatni yuboruvchi): ${user_name || "Mijoz"}.

Quyidagi xavflarni e'tiroz sifatida xatda yoritib, shartnomadagi shu bandlarni o'zgartirishni so'rang:
${risksText}

XAT TUZILISHI:
1. Ikkinchi tarafga rasmiy salomlashish (Hurmatli hamkor, va hokazo).
2. Hamkorlikdan mamnunlik bildirish, lekin shartnomaning ba'zi bandlari qabul qilinmasligini aytish.
3. Yuqoridagi xavflardan kelib chiqib, aniq qaysi bandlar qanday o'zgarishi kerakligini talab qilish.
4. Rasmiy xayrlashuv.

QAT'IY QOIDALAR:
- INGLIZ YOKI RUS TILIDA YOZMANG, FAQAT O'ZBEK TILIDA YOZING.
- [Kompaniya nomi] kabi qavslar qoldirmang, o'rniga "Sizning korxonangiz" yoki "Bizning tomon" kabi umumiy so'zlardan foydalaning.`;

    // Attempt AI Generation
    let draftText = "";
    try {
      const response = await openrouter.chat.completions.create({
        model: "openrouter/free", // auto-routes to fastest available model
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Iltimos, yuqoridagi shartlarga asosan xatni shakllantirib bering." }
        ],
      });
      draftText = response.choices[0].message.content || "";
    } catch (e: any) {
      console.warn("OpenRouter API Failed, falling back to Llama", e);
      try {
        const fallbackResp = await openrouter.chat.completions.create({
          model: "google/gemma-4-31b-it:free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Iltimos, yuqoridagi shartlarga asosan xatni shakllantirib bering." }
          ],
        });
        draftText = fallbackResp.choices[0].message.content || "";
      } catch (e2: any) {
        throw new Error("AI Modellarida uzilish. Iltimos keyinroq urinib ko'ring.");
      }
    }

    if (!draftText) throw new Error("AI javob qaytarmadi.");

    // Decrement 3 coins
    const { error: deductErr } = await authSupabase.rpc('decrement_coins_amount', { amount: 3 });
    if (deductErr) throw new Error("Coin yechishda xatolik");

    // Save draft to DB using Service Role Key to bypass RLS UPDATE issues
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const updatedDrafts = [...(scanSession.counter_offer_draft || []), { tone, selected_risks, draft: draftText, created_at: new Date().toISOString() }];
    const { error: updateError } = await serviceSupabase.from('scan_sessions').update({ counter_offer_draft: updatedDrafts }).eq('id', session_id);
    if (updateError) {
      console.error("Failed to update counter offer draft:", updateError);
    }

    return NextResponse.json({ success: true, draft: draftText });

  } catch (err: any) {
    console.error("Counter-offer API error:", err);
    return NextResponse.json({ error: err.message || "Xatolik yuz berdi" }, { status: 500 });
  }
}
