import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export const maxDuration = 60; // Max duration to ensure sending emails to many users


export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ detail: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }

    const { subject, body } = await req.json();

    if (!subject || !body) {
      return NextResponse.json({ detail: "Mavzu yoki matn bo'sh" }, { status: 400 });
    }

    // Initialize authenticated Supabase client
    const authSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Fetch all users securely (RPC checks if the caller is an admin)
    const { data: users, error } = await authSupabase.rpc('get_all_users');

    if (error) {
      console.error("Admin check or fetch users error:", error);
      return NextResponse.json({ detail: "Sizda ruxsat yo'q yoki tizim xatosi" }, { status: 403 });
    }

    // users is an array of JSON objects: { email: string, ... }
    const emailList = (users as any[] || [])
      .map((u: any) => u.email)
      .filter((email: string) => Boolean(email));

    if (emailList.length === 0) {
      return NextResponse.json({ detail: "Yuborish uchun email topilmadi" }, { status: 400 });
    }

    console.log(`Sending email broadcast to ${emailList.length} users:`, emailList);

    // Prepare NodeMailer transport
    // Replace with your real SMTP credentials when you have your official email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || "info@mohiyat.uz", // O'zingizning rasmiy emailingiz
        pass: process.env.SMTP_PASS || "parolni_env_ga_yozing", // Pochtangiz paroli (App Password)
      },
    });

    // If SMTP_PASS is missing, we just simulate sending so the app doesn't crash in early MVP mode
    if (!process.env.SMTP_PASS) {
      console.warn("SMTP_PASS topilmadi! Email yuborish simulyatsiya qilindi.");
      return NextResponse.json({ success: true, simulated: true, count: emailList.length });
    }

    // Send the email (using BCC to protect privacy)
    await transporter.sendMail({
      from: `"Mohiyat AI" <${process.env.SMTP_USER || "info@mohiyat.uz"}>`,
      to: process.env.SMTP_USER || "info@mohiyat.uz", // Send to self
      bcc: emailList, // BCC everyone else
      subject: subject,
      text: body,
      // html: `<p>${body}</p>` // You can add HTML here if desired
    });

    return NextResponse.json({ success: true, count: emailList.length });

  } catch (error: any) {
    console.error("Email API error:", error);
    return NextResponse.json({ detail: "Ichki server xatosi", error: error.message }, { status: 500 });
  }
}
