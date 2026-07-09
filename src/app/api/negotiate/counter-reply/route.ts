import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Avtorizatsiya talab qilinadi" }, { status: 401 });

    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: userResp, error: userErr } = await authSupabase.auth.getUser();
    if (userErr || !userResp?.user) return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 401 });

    const { session_id, replies } = await req.json();

    const { data: rooms, error: roomErr } = await authSupabase
      .from("negotiation_rooms")
      .select("*")
      .eq("session_id", session_id);

    if (roomErr || !rooms || rooms.length === 0) throw new Error("Xona topilmadi");
    const room = rooms[0];

    // Check auth
    if (room.initiator_id !== userResp.user.id) {
      return NextResponse.json({ error: "Sizda ruxsat yo'q" }, { status: 403 });
    }

    let demands = [...room.demands];
    let responses = room.responses ? [...room.responses] : [];

    // Process each reply
    for (const [indexStr, replyText] of Object.entries(replies)) {
      const idx = parseInt(indexStr);
      if (isNaN(idx)) continue;

      const demand = demands[idx];
      const resp = responses.find((r: any) => r.demand_index === idx);

      if (!demand.discussion) demand.discussion = [];
      
      if (resp && resp.decision === "counter" && resp.counter_text) {
        // Add guest's counter and initiator's reply to discussion
        demand.discussion.push({ from: "guest", text: resp.counter_text, time: new Date().toISOString() });
        demand.discussion.push({ from: "initiator", text: replyText as string, time: new Date().toISOString() });
        
        // Remove this response so guest has to answer again
        responses = responses.filter((r: any) => r.demand_index !== idx);
      }
    }

    const { error: updateErr } = await authSupabase
      .from("negotiation_rooms")
      .update({
        demands,
        responses,
        status: "pending" // Send back to guest
      })
      .eq("id", room.id);

    if (updateErr) throw updateErr;

    // Optional notification for guest if they are registered
    if (room.guest_user_id && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const serviceSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY);
        await serviceSupabase.from("app_notifications").insert({
            user_id: room.guest_user_id,
            title: "Yangi taklif keldi",
            message: "Tashabbuskor sizning qarshi taklifingizga javob qaytardi.",
            link_url: `/negotiate/${room.guest_token}`
        });
        await sendTelegramNotification(
            room.guest_user_id,
            "Yangi taklif keldi",
            "Tashabbuskor sizning qarshi taklifingizga javob qaytardi.",
            `/negotiate/${room.guest_token}`
        );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("counter-reply err:", err);
    return NextResponse.json({ error: err.message || "Xatolik" }, { status: 500 });
  }
}
