import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { sendTelegramNotification } from "@/lib/telegram";

export const maxDuration = 30;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const ratelimit = (redisUrl && redisToken)
  ? new Ratelimit({ redis: new Redis({ url: redisUrl, token: redisToken }), limiter: Ratelimit.slidingWindow(10, "1 m"), analytics: true })
  : null;

export async function POST(req: NextRequest) {
  try {
    if (ratelimit) {
      const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
      const { success } = await ratelimit.limit(ip);
      if (!success) return NextResponse.json({ error: "Juda ko'p so'rov" }, { status: 429 });
    }

    const { token, responses, guest_user_id, guest_name } = await req.json();
    if (!token || !responses?.length || !guest_user_id) {
      return NextResponse.json({ error: "token, responses va guest_user_id talab qilinadi" }, { status: 400 });
    }

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: newStatus, error } = await serviceSupabase.rpc("submit_guest_response", {
      p_token: token,
      p_responses: responses,
      p_guest_user_id: guest_user_id,
      p_guest_name: guest_name || "Mehmon",
    });

    if (error) {
      console.error("submit_guest_response error:", error);
      return NextResponse.json({ error: error.message || "Javob yuborishda xatolik" }, { status: 400 });
    }

    if (newStatus === "awaiting_confirmation") {
      const { data: roomData } = await serviceSupabase.from("negotiation_rooms").select("initiator_id, session_id").eq("guest_token", token).single();
      if (roomData) {
        await sendTelegramNotification(
          roomData.initiator_id,
          "Muzokaraga javob keldi",
          "Mehmon o'z javob va qarshi takliflarini yubordi. Ko'rib chiqib tasdiqlashingiz kutilmoqda.",
          `/results/${roomData.session_id}`
        );
      }
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err: any) {
    console.error("negotiate/respond error:", err);
    return NextResponse.json({ error: err.message || "Xatolik yuz berdi" }, { status: 500 });
  }
}
