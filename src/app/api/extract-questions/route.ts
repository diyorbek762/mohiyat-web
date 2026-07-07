import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import pdfParse from "pdf-parse";

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
      limiter: Ratelimit.slidingWindow(10, "1 m"),
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

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ questions: [] });
    }

    let documentText = "";

    try {
      if (file.type === "application/pdf") {
        const buffer = await file.arrayBuffer();
        const parsed = await pdfParse(Buffer.from(buffer));
        documentText = parsed.text;
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        // Simplified fallback for now
        documentText = "Word document detected (extract-questions relies on PDF/Text)."; 
      } else if (file.type.startsWith("text/")) {
        documentText = await file.text();
      } else if (file.type.startsWith("image/")) {
         // Images are hard to OCR fast, so we skip questions for images to save time.
         return NextResponse.json({ questions: [] });
      }
    } catch (e) {
      console.warn("Failed to parse file for questions:", e);
      return NextResponse.json({ questions: [] });
    }

    if (!documentText) {
      return NextResponse.json({ questions: [] });
    }

    const truncatedText = documentText.substring(0, 50000); // 50k chars is enough for context extraction

    const systemPrompt = `Siz huquqiy tahlilchi AIsiz. Foydalanuvchi hujjat yukladi.
Vazifangiz: Shu hujjatni tahlil qilish uchun foydalanuvchidan qanday muhim kontekst (ma'lumot) kerakligini aniqlash va 1 ta yoki 2 ta qisqa savol tuzish.

Masalan:
- Agar uy-joy shartnomasi bo'lsa: "Siz uyni olyapsizmi yoki sotyapsizmi?"
- Agar kredit bo'lsa: "Oylik rasmiy daromadingiz taxminan qancha?" yoki "Boshqa kreditlaringiz bormi?"
- Agar shartnoma oddiy bo'lsa va qo'shimcha ma'lumot shart bo'lmasa, bo'sh ro'yxat qaytaring.

QOIDALAR:
1. FAQAT JSON formatida javob bering, boshqa hech qanday so'z yozmang.
2. Savollar o'zbek tilida, qisqa va aniq bo'lishi kerak.
3. Maksimal 2 ta savol.

Kutilayotgan JSON format:
{
  "questions": [
    "Savol 1?",
    "Savol 2?"
  ]
}

Shartnoma matni:
${truncatedText}`;

    let jsonResponse = { questions: [] };

    try {
      const response = await openrouter.chat.completions.create({
        model: "openrouter/free",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt }
        ],
      });
      
      const content = response.choices[0].message.content || "{}";
      jsonResponse = JSON.parse(content);
    } catch (e: any) {
      console.warn("Fast Extract Questions Failed:", e.message);
      // Fail gracefully, returning no questions so the process can continue without blocking
      return NextResponse.json({ questions: [] });
    }

    return NextResponse.json(jsonResponse);

  } catch (err: any) {
    console.error("Extract questions error:", err);
    return NextResponse.json({ questions: [] }); // Always fail gracefully so scan can proceed
  }
}
