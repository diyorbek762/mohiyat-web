import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { sendTelegramNotification } from "@/lib/telegram";

export const maxDuration = 90;

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

export async function POST(req: NextRequest) {
  // Internal route — validate secret header
  const secret = req.headers.get("x-internal-secret");
  if (secret !== (process.env.INTERNAL_SECRET || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { room_id, initiator_id } = await req.json();
    if (!room_id || !initiator_id) {
      return NextResponse.json({ error: "room_id va initiator_id talab qilinadi" }, { status: 400 });
    }

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch room
    const { data: room, error: roomErr } = await serviceSupabase
      .from("negotiation_rooms")
      .select("*, scan_sessions(full_report, short_title, file_name)")
      .eq("id", room_id)
      .eq("initiator_id", initiator_id)
      .eq("status", "ai_drafting")
      .single();

    if (roomErr || !room) {
      console.error("Finalize: room not found", roomErr);
      return NextResponse.json({ error: "Xona topilmadi" }, { status: 404 });
    }

    const demands: any[] = room.demands || [];
    const responses: any[] = room.responses || [];
    const scanSession: any = room.scan_sessions;

    // Build context for AI
    const demandsText = demands.map((d: any, i: number) => {
      const resp = responses.find((r: any) => r.demand_index === i);
      return `
Band ${i + 1}: ${d.risk_title}
  Hozirgi holat: ${d.current_text || "(ko'rsatilmagan)"}
  1-tomon talabi: ${d.proposed_change}
  ${d.discussion && d.discussion.length > 0 ? `Oldingi muhokama (Ping-Pong):\n    ${d.discussion.map((msg: any) => `${msg.from === 'initiator' ? '1-tomon' : '2-tomon'}: ${msg.text}`).join('\n    ')}\n` : ''}  2-tomon javobi: ${resp ? (resp.decision === "accept" ? "✅ Qabul" : resp.decision === "reject" ? "❌ Rad" : `🔄 Qarshi taklif: ${resp.counter_text}`) : "Javob yo'q"}`;
    }).join("\n");

    const systemPrompt = `Siz O'zbekiston qonunchiligiga asoslangan professional yuridik vositachi (hakam) siz.
Ikkita tomon o'rtasidagi shartnoma muzokarasi natijasini ko'rib, har bir band bo'yicha adolatli, qonuniy kompromiss taklif qiling.

Shartnoma: ${scanSession?.short_title || "Shartnoma"}
Tuzilgan tahlil xulosasi: ${scanSession?.full_report?.overall_summary || "Mavjud emas"}

Muzokara bandlari:
${demandsText}

QAT'IY QOIDALAR:
1. FAQAT JSON format qaytaring, boshqa hech narsa yozmang
2. Har bir band uchun "compromise" — O'zbekiston Fuqarolik Kodeksi yoki Mehnat Kodeksiga asoslangan adolatli yechim
3. "legal_basis" — aniq qonun moddasi (masalan "FK 539-modda")
4. "balance" — 0-100, 50 teng adolatli, 0 = to'liq 1-tomon foydasiga, 100 = to'liq 2-tomon foydasiga
5. Barcha matnlar O'ZBEK TILIDA bo'lishi shart

Kutilayotgan JSON:
{
  "clauses": [
    {
      "demand_index": 0,
      "risk_title": "...",
      "initiator_ask": "...",
      "guest_response": "accept|reject|counter",
      "compromise": "AI tavsiya etgan yangi band matni",
      "legal_basis": "FK 539-modda",
      "balance": 55
    }
  ],
  "summary": "Umumiy kompromiss xulosasi",
  "overall_balance": 52
}`;

    let aiResult: any = null;

    // Primary attempt
    try {
      const response = await openrouter.chat.completions.create({
        model: "openrouter/free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Iltimos, yuqoridagi muzokaraga asosan adolatli kompromiss yarating." }
        ],
      });
      let raw = response.choices[0].message.content || "{}";
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start !== -1 && end !== -1 && start <= end) {
        raw = raw.substring(start, end + 1);
      }
      aiResult = JSON.parse(raw);
    } catch (e1) {
      console.warn("Primary AI failed, trying fallback:", e1);
      try {
        const fallback = await openrouter.chat.completions.create({
          model: "google/gemma-4-31b-it:free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Adolatli kompromiss yarating." }
          ],
        });
        let raw = fallback.choices[0].message.content || "{}";
        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");
        if (start !== -1 && end !== -1 && start <= end) {
          raw = raw.substring(start, end + 1);
        }
        aiResult = JSON.parse(raw);
      } catch (e2) {
        throw new Error("AI kompromiss yaratishda xatolik yuz berdi.");
      }
    }

    if (!aiResult?.clauses) throw new Error("AI noto'g'ri javob qaytardi.");

    const balance = aiResult.overall_balance ?? 50;

    // Mark room as completed
    const { error: updateErr } = await serviceSupabase
      .from("negotiation_rooms")
      .update({
        status: "completed",
        ai_compromise: aiResult,
        compromise_balance: balance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", room_id);

    if (updateErr) throw new Error("Room yangilanmadi: " + updateErr.message);

    // Deduct 10 coins from initiator (using service role with auth.uid override not possible,
    // so we do a direct UPDATE with a WHERE clause)
    await serviceSupabase
      .from("profiles")
      .update({ balance: serviceSupabase.rpc("decrement_coins_amount", { amount: 10 }) as any })
      .eq("id", initiator_id);

    // Simpler coin deduction via raw SQL through rpc workaround
    const { error: deductErr } = await serviceSupabase.rpc("deduct_coins_for_user", { p_user_id: initiator_id, p_amount: 10 });
    if (deductErr) {
      console.warn("deduct_coins_for_user RPC not found or failed, coins not deducted", deductErr);
    }

    // Send instant Telegram notifications
    await sendTelegramNotification(
      initiator_id,
      "Kompromiss tayyor",
      "AI ikkala tomon talablari asosida adolatli kompromiss hujjatini shakllantirdi.",
      `/results/${scanSession?.id || room.session_id}`
    );
    
    if (room.guest_user_id) {
      await sendTelegramNotification(
        room.guest_user_id,
        "Kompromiss tayyor",
        "AI ikkala tomon talablari asosida adolatli kompromiss hujjatini shakllantirdi.",
        `/negotiate/${room.guest_token}`
      );
    }

    return NextResponse.json({ success: true, balance });
  } catch (err: any) {
    console.error("negotiate/finalize error:", err);
    // Mark room as failed so user can retry
    return NextResponse.json({ error: err.message || "Finalize xatolik" }, { status: 500 });
  }
}
