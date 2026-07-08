import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 30;

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

    const { session_id, demands } = await req.json();
    if (!session_id || !demands?.length) {
      return NextResponse.json({ error: "session_id va demands talab qilinadi" }, { status: 400 });
    }

    // Check initiator owns this session
    const { data: session, error: sessionErr } = await authSupabase
      .from("scan_sessions")
      .select("id, user_id")
      .eq("id", session_id)
      .eq("user_id", userResp.user.id)
      .single();

    if (sessionErr || !session) {
      return NextResponse.json({ error: "Tahlil seansi topilmadi" }, { status: 404 });
    }

    // Check coin balance (costs 5 coins)
    const { data: profile } = await authSupabase.from("profiles").select("balance").eq("id", userResp.user.id).single();
    if (!profile || profile.balance < 5) {
      return NextResponse.json({ error: "Hisobingizda yetarli Coin yo'q (5 Coin kerak)" }, { status: 402 });
    }

    // Use service role to create room (bypasses RLS on insert for guest_token generation)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: room, error: roomErr } = await serviceSupabase
      .from("negotiation_rooms")
      .insert({
        session_id,
        initiator_id: userResp.user.id,
        demands,
        status: "pending",
      })
      .select("id, guest_token")
      .single();

    if (roomErr || !room) {
      console.error("Room creation error:", roomErr);
      return NextResponse.json({ error: "Muzokara xonasi yaratilmadi" }, { status: 500 });
    }

    // Deduct 5 coins
    await authSupabase.rpc("decrement_coins_amount", { amount: 5 });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mohiyat.uz";
    const guestUrl = `${baseUrl}/negotiate/${room.guest_token}`;

    return NextResponse.json({ success: true, room_id: room.id, guest_url: guestUrl });
  } catch (err: any) {
    console.error("negotiate/invite error:", err);
    return NextResponse.json({ error: err.message || "Xatolik yuz berdi" }, { status: 500 });
  }
}
