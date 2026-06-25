import { NextRequest, NextResponse } from "next/server";
import { genAI, SYSTEM_INSTRUCTION } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import pdfParse from "pdf-parse";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Vercel Serverless Function Timeout Configuration (60 seconds)
// This prevents 504 Gateway Timeout errors when OpenRouter fallback takes too long.
export const maxDuration = 60;

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

// Upstash Rate Limiter (5 requests per minute per IP)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const ratelimit = (redisUrl && redisToken)
  ? new Ratelimit({
      redis: new Redis({ url: redisUrl, token: redisToken }),
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
    })
  : null;

export async function POST(req: NextRequest) {
  try {
    // 0. Rate Limiting Protection (Bot va DDoS himoyasi)
    if (ratelimit) {
      // Get IP address from Vercel headers or fallback
      const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "127.0.0.1";
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json(
          { detail: "Juda ko'p so'rov yuborildi. Iltimos 1 daqiqa kuting (Anti-Spam himoyasi)." }, 
          { status: 429 }
        );
      }
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("document_type") as string || "other";
    const userId = formData.get("user_id") as string | null;

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token || !userId) {
      return NextResponse.json({ detail: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
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

    // Check Coin Balance
    const { data: profile, error: profileError } = await authSupabase
      .from("profiles")
      .select("balance")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ detail: "Profil topilmadi" }, { status: 404 });
    }

    if (profile.balance < 1) {
      return NextResponse.json({ detail: "Tanga yetarli emas. Hamyonni to'ldiring." }, { status: 402 });
    }

    if (!file) {
      return NextResponse.json({ detail: "Fayl topilmadi" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Matnni oldindan ajratib olish (RAG va OpenRouter uchun)
    let documentText = "";
    if (file.type === "application/pdf") {
      try {
        const pdfData = await pdfParse(buffer);
        documentText = pdfData.text;
      } catch (e) {
        console.warn("PDF parse failed during RAG:", e);
      }
    } else if (file.type.startsWith("text/")) {
      documentText = buffer.toString("utf8");
    }

    let specificRules = "Umumiy yuridik qoidalarga asosan tekshiring.";
    
    // 2. Vector RAG: Fayl matnidan eng mos qonun moddalarini qidirish
    if (documentText.trim()) {
      try {
        // Embed the first 10,000 characters to get the gist of the document
        const textToEmbed = documentText.substring(0, 10000);
        const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
        const embedResult = await embeddingModel.embedContent({
          content: { role: 'user', parts: [{ text: textToEmbed }] },
          outputDimensionality: 768
        } as any);
        
        const embedding = embedResult.embedding.values;

        // Qidiruvni amalga oshirish
        const { data: matchedDocs, error: matchError } = await supabase.rpc('match_legal_documents', {
          query_embedding: embedding,
          match_threshold: 0.3, // Keep threshold relatively low to ensure matches
          match_count: 15
        });

        if (matchError) {
          console.error("Vector RAG Error:", matchError);
        } else if (matchedDocs && matchedDocs.length > 0) {
          const retrievedArticles = matchedDocs.map((doc: any) => `[${doc.codex_name} - ${doc.article_num}]:\n${doc.content}`).join("\n\n");
          specificRules = `DIQQAT! Ushbu hujjat tahlili uchun O'zbekiston qonunchiligidan quyidagi eng mos keladigan moddalar topildi. Faqat shularga tayanib xavflarni baholang:\n\n${retrievedArticles}`;
        }
      } catch (embError) {
        console.error("Embedding generation failed:", embError);
      }
    } 
    
    // 3. Zaxira (Fallback): RAG ishlamasa yoki fayl rasm bo'lsa
    if (specificRules === "Umumiy yuridik qoidalarga asosan tekshiring.") {
      const { data: ruleData, error: ruleError } = await supabase
        .from('document_rules')
        .select('rules_text')
        .eq('doc_type', documentType)
        .single();
        
      if (ruleData && ruleData.rules_text) {
        specificRules = ruleData.rules_text;
      }
    }

    const dynamicInstruction = `${SYSTEM_INSTRUCTION}

QO'SHIMCHA MAXSUS QOIDALAR (FAQAT SHU QOIDALARGA ASOSLANIB TAHLIL QILING! BOSHQA QONUNLARNI O'YLAB TOPMANG!):
${specificRules}`;

    // Using Gemini 2.0 Flash for better availability
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: dynamicInstruction,
      generationConfig: { responseMimeType: "application/json" }
    });

    const filePart = {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: file.type,
      },
    };

    const startTime = Date.now();
    let responseText = "";
    let finalModelUsed = "gemini-2.0-flash";

    try {
      // TIER 1: Gemini 2.0 Flash Natively
      const result = await model.generateContent([
        "Ushbu hujjatni tahlil qiling va xavflarni aniqlang.",
        filePart
      ]);
      responseText = result.response.text();
    } catch (geminiError: any) {
      console.warn("Gemini Failed. Falling back to OpenRouter. Error:", geminiError.message);
      
      // Prepare message for OpenRouter (supports images natively now)
      let openRouterMessages: any[] = [];
      if (documentText) {
        openRouterMessages = [
          { role: "system", content: dynamicInstruction },
          { role: "user", content: `Ushbu hujjatni tahlil qiling va xavflarni aniqlang:\n\n${documentText}` }
        ];
      } else if (file.type.startsWith("image/")) {
        openRouterMessages = [
          { role: "system", content: dynamicInstruction },
          { role: "user", content: [
            { type: "text", text: "Ushbu hujjatni tahlil qiling va xavflarni aniqlang:" },
            { type: "image_url", image_url: { url: `data:${file.type};base64,${buffer.toString("base64")}` } }
          ]}
        ];
      } else {
        throw new Error("Kechirasiz, ushbu fayl formati qo'llab-quvvatlanmaydi.");
      }

      try {
        // TIER 2: Gemini 2.0 Pro Exp (OpenRouter - Vision Capable)
        finalModelUsed = "google/gemini-2.0-pro-exp-02-05:free";
        const orResult = await openrouter.chat.completions.create({
          model: "google/gemini-2.0-pro-exp-02-05:free",
          messages: openRouterMessages,
          max_tokens: 4000
        });
        responseText = orResult.choices[0].message.content || "";
      } catch (tier2Error: any) {
        console.warn("Tier 2 Failed. Falling back to Tier 3. Error:", tier2Error.message);
        
        if (file.type.startsWith("image/")) {
            throw new Error("Zaxira tizimi orqali rasmlarni tahlil qilish imkoniyati vaqtincha cheklangan. Iltimos PDF yuklang.");
        }

        // TIER 3: Llama 3.3 70B (Juda aqlli va aniq JSON beradi)
        finalModelUsed = "meta-llama/llama-3.3-70b-instruct:free";
        const orResult2 = await openrouter.chat.completions.create({
          model: "meta-llama/llama-3.3-70b-instruct:free",
          messages: openRouterMessages,
          max_tokens: 4000
        });
        responseText = orResult2.choices[0].message.content || "";
      }
    }

    const processingMs = Date.now() - startTime;

    let analysis;
    try {
      // Extract just the JSON part (from first '{' to last '}')
      const startIndex = responseText.indexOf('{');
      const endIndex = responseText.lastIndexOf('}');
      
      if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
        const jsonString = responseText.substring(startIndex, endIndex + 1);
        analysis = JSON.parse(jsonString);
      } else {
        throw new Error("JSON qavslari topilmadi");
      }
    } catch (e: any) {
      console.error("JSON Parse xatosi. Asl matn:", responseText);
      analysis = {
        short_title: "Tahlil natijasi",
        blind_spots: [{ 
          title: "Model Noto'g'ri Format Qaytardi", 
          severity: "high", 
          section_ref: "Server xatosi", 
          recommendation: `RAW JAVOB: ${responseText.substring(0, 400)}... (Xato: ${e.message})`
        }],
        risk_score: 50,
        overall_summary: "AI natijani JSON formatida qaytara olmadi."
      };
    }

    // Since we paused payment, we save the full_report directly and unlock it
    const sessionData = {
      user_id: userId,
      file_name: file.name,
      file_hash: "v2-no-hash-needed", 
      page_count: 1, // Optional: Calculate natively if needed
      detected_domain: analysis.detected_domain || "other",
      short_title: analysis.short_title || "Shartnoma",
      blind_spots: analysis.blind_spots || [],
      risk_score: analysis.risk_score || 50,
      full_report: analysis, // <--- FULL REPORT UNLOCKED FOR FREE
      llm_model_used: finalModelUsed,
      processing_ms: processingMs,
      status: "unlocked", // <--- MARKED AS UNLOCKED
    };

    const { data: insertedSession, error: insertError } = await authSupabase
      .from("scan_sessions")
      .insert(sessionData)
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      // Still return the analysis to the user, but warn about save failure
    }

    // Decrement balance securely using atomic RPC
    const { error: updateError } = await authSupabase.rpc('decrement_coins');
      
    if (updateError) {
      console.error("Failed to deduct coin:", updateError);
    }

    // Return the response to the frontend
    return NextResponse.json({
      session_id: insertedSession?.id || "temp-session",
      blind_spots: analysis.blind_spots || [],
      risk_score: analysis.risk_score || 50,
      summary: analysis.overall_summary || "",
      page_count: 1,
      processing_ms: processingMs,
      model_used: finalModelUsed,
    });

  } catch (error: any) {
    console.error("Scan API Error:", error);
    return NextResponse.json(
      { detail: error.message || "Tahlil jarayonida xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
