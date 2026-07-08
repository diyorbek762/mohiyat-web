import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const maxDuration = 300; // Allow max 5 minutes for processing large codes

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    // 1. Basic auth check to prevent abuse
    const secret = req.headers.get("x-internal-secret");
    if (secret !== (process.env.INTERNAL_SECRET || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { lexId } = await req.json();
    if (!lexId) return NextResponse.json({ error: "lexId missing" }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Fetch Lex.uz document
    // Lex.uz usually serves printable versions without much UI at a specific endpoint, or we can just fetch the main page
    const lexUrl = `https://lex.uz/uz/docs/${lexId}`;
    const res = await fetch(lexUrl);
    if (!res.ok) throw new Error(`Failed to fetch ${lexUrl}`);
    
    let html = await res.text();
    
    // Extract title (simple regex)
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(' - Lex.uz', '').trim() : `Lex.uz Document ${lexId}`;
    
    // Naive text extraction (strip HTML tags)
    // In production, we'd use Cheerio to extract just the main content body
    let rawText = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    rawText = rawText.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    rawText = rawText.replace(/<[^>]*>?/gm, ' ');
    rawText = rawText.replace(/\s+/g, ' ').trim();

    // 3. Chunking the text (e.g., 2000 characters per chunk)
    // To fit into embedding models and vector DB optimally
    const CHUNK_SIZE = 2000;
    const chunks = [];
    for (let i = 0; i < rawText.length; i += CHUNK_SIZE) {
      chunks.push(rawText.substring(i, i + CHUNK_SIZE));
    }

    // 4. Generate Embeddings & Save
    // We will process chunks sequentially or in small batches to avoid rate limits
    let inserted = 0;
    for (const chunk of chunks) {
      // Create embedding using Gemini or OpenAI (via OpenRouter if supported, but typically embeddings use standard OpenAI or dedicated embedding models)
      // OpenRouter supports `openai/text-embedding-3-small` or similar, but let's assume we use a standard embedding model
      try {
        const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: chunk
          })
        });

        if (!embeddingRes.ok) {
           console.error("Embedding failed:", await embeddingRes.text());
           continue; 
        }

        const embeddingData = await embeddingRes.json();
        const embedding = embeddingData.data[0].embedding;

        // Save to Supabase pgvector
        const { error: insertErr } = await supabase.from('legal_knowledge').insert({
          lex_uz_id: lexId,
          title: title,
          content_chunk: chunk,
          category: "General",
          embedding: embedding,
        });

        if (!insertErr) inserted++;
      } catch (embErr) {
        console.error("Error on chunk:", embErr);
      }
    }

    return NextResponse.json({ success: true, chunksProcessed: chunks.length, inserted });
  } catch (error: any) {
    console.error("Process Single Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
