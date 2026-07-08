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

    const { room_id, approved } = await req.json();
    if (!room_id || approved === undefined) {
      return NextResponse.json({ error: "room_id va approved talab qilinadi" }, { status: 400 });
    }

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: newStatus, error: confirmErr } = await serviceSupabase.rpc("confirm_negotiation", {
      p_room_id: room_id,
      p_initiator_id: userResp.user.id,
      p_approved: approved,
    });

    if (confirmErr) {
      return NextResponse.json({ error: confirmErr.message || "Tasdiqlashda xatolik" }, { status: 400 });
    }

    // If approved, trigger finalize in background (non-blocking)
    if (approved && newStatus === "ai_drafting") {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      // Fire-and-forget — don't await so we return immediately to the client
      fetch(`${siteUrl}/api/negotiate/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.INTERNAL_SECRET || "",
        },
        body: JSON.stringify({ room_id, initiator_id: userResp.user.id }),
      }).catch(e => console.error("Background finalize failed:", e));
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err: any) {
    console.error("negotiate/confirm error:", err);
    return NextResponse.json({ error: err.message || "Xatolik yuz berdi" }, { status: 500 });
  }
}
