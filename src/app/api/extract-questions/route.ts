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
Vazifangiz: 
1. Hujjat turini (domain) aniqlash. Agar hujjat qarz, kredit, lizing, yoki bo'lib to'lashga oid bo'lsa "kredit_yoki_qarz" deb belgilang.
2. Agar hujjat "kredit_yoki_qarz" bo'lsa, "questions" arrayini quyidagi 3 ta savol bilan to'ldiring:
   - "Oyiga qat'iy daromadingiz qancha (naqd va plastikni qo'shib)?"
   - "Har oylik yashash xarajatlaringiz qancha (ijara, ro'zg'or)?"
   - "Hozir to'layotgan boshqa qarz yoki kreditingiz bormi?"
3. Agar hujjat boshqa turdagi (ijara, mehnat, oldi-sotdi) bo'lsa, uni tushunish uchun kerak bo'ladigan o'zingizning 1-2 ta qisqa savolingizni bering. Yoki hech qanday savol kerak bo'lmasa bo'sh ro'yxat qaytaring.

QOIDALAR:
1. FAQAT JSON formatida javob bering, boshqa hech narsa yozmang.
2. Savollar o'zbek tilida bo'lishi kerak.

Kutilayotgan JSON format:
{
  "domain": "kredit_yoki_qarz|boshqa",
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
        messages: [
          { role: "system", content: systemPrompt }
        ],
      });
      
      let content = response.choices[0].message.content || "{}";
      
      // Extract JSON using regex in case model wraps it in markdown
      const startIndex = content.indexOf('{');
      const endIndex = content.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
        content = content.substring(startIndex, endIndex + 1);
      }
      
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
