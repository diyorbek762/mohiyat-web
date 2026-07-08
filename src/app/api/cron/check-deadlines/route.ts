import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    // 1. Verify Vercel Cron Secret (Security)
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize Supabase Admin Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Calculate target dates
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const threeDaysStr = threeDaysFromNow.toISOString().split("T")[0];

    // 3. Fetch all active scan sessions that have a deadline
    const { data: sessions, error: sessionErr } = await supabase
      .from("scan_sessions")
      .select("id, short_title, crm_deadline, crm_amount, crm_currency, crm_counterparty, org_id, user_id")
      .not("crm_deadline", "is", null);

    if (sessionErr) throw sessionErr;

    const notificationsToInsert: any[] = [];
    const notificationFlags: any[] = []; // to prevent duplicate alerts

    // Fetch existing notification flags for today to avoid spamming
    // We will use a special metadata tag in link_url to track it temporarily or check existing notifications
    // A better way is to just query existing recent notifications
    const { data: recentNotifs } = await supabase
      .from("app_notifications")
      .select("link_url, title")
      .gte("created_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .like("title", "%Muddat%");

    const recentNotifLinks = recentNotifs ? recentNotifs.map(n => n.link_url) : [];

    for (const session of sessions) {
      if (!session.crm_deadline) continue;

      const deadlineDate = new Date(session.crm_deadline);
      const diffTime = deadlineDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Alert conditions: exactly 3 days or exactly 1 day remaining
      if (diffDays === 3 || diffDays === 1) {
        const linkUrl = `/results/${session.id}`;
        
        // Prevent duplicate alerts for the same session today
        if (recentNotifLinks.includes(linkUrl)) continue;

        const amountText = session.crm_amount ? `${session.crm_amount} ${session.crm_currency || "UZS"}` : "Kiritilmagan";
        const counterparty = session.crm_counterparty || "Noma'lum tomon";

        const title = `Muddat Eslatmasi: ${diffDays} kun qoldi!`;
        const message = `"${session.short_title}" bo'yicha ${counterparty} bilan kelishuv muddati tugamoqda. Summa: ${amountText}.`;

        // Determine who gets the notification (Org members or Individual user)
        if (session.org_id) {
          const { data: members } = await supabase
            .from("organization_members")
            .select("user_id")
            .eq("org_id", session.org_id);
            
          if (members) {
            members.forEach(m => {
              notificationsToInsert.push({
                user_id: m.user_id,
                title,
                message,
                link_url: linkUrl
              });
            });
          }
        } else if (session.user_id) {
          notificationsToInsert.push({
            user_id: session.user_id,
            title,
            message,
            link_url: linkUrl
          });
        }
      }
    }

    // 4. Insert Notifications into DB
    if (notificationsToInsert.length > 0) {
      const { error: insertErr } = await supabase.from("app_notifications").insert(notificationsToInsert);
      if (insertErr) throw insertErr;
    }

    return NextResponse.json({ success: true, alertsSent: notificationsToInsert.length });
  } catch (err: any) {
    console.error("Cron Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
