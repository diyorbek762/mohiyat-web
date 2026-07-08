import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    const { notification_id } = await req.json();
    if (!notification_id) return NextResponse.json({ error: "Xabar ID berilmadi" }, { status: 400 });

    const { error } = await authSupabase
      .from("app_notifications")
      .update({ is_read: true })
      .eq("id", notification_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("notifications/read error:", err);
    return NextResponse.json({ error: "Xatolik yuz berdi" }, { status: 500 });
  }
}
