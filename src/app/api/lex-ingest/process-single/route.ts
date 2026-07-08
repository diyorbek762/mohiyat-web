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

    // 4. Generate Embeddings & Save in BATCHES
    // Vercel serverless timeout is 10-60s. Sequential requests will timeout.
    // Gemini supports batchEmbedContents up to 100 chunks per request.
    const BATCH_SIZE = 100;
    let inserted = 0;
    
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      
      const batchRequests = batchChunks.map(chunk => ({
        model: "models/gemini-embedding-2",
        content: { parts: [{ text: chunk }] }
      }));

      try {
        const embeddingRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents?key=${process.env.GOOGLE_API_KEY}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requests: batchRequests
          })
        });

        if (!embeddingRes.ok) {
           console.error("Gemini Batch Embedding failed:", await embeddingRes.text());
           continue; 
        }

        const embeddingData = await embeddingRes.json();
        
        // Prepare bulk insert to Supabase
        const insertData = embeddingData.embeddings.map((emb: any, idx: number) => ({
          lex_uz_id: lexId,
          title: title,
          content_chunk: batchChunks[idx],
          category: "General",
          embedding: emb.values,
        }));

        // Save to Supabase pgvector in bulk
        const { error: insertErr } = await supabase.from('legal_knowledge').insert(insertData);

        if (!insertErr) {
          inserted += batchChunks.length;
        } else {
          console.error("Supabase Bulk Insert Error:", insertErr);
        }
      } catch (embErr) {
        console.error("Error on batch:", embErr);
      }
    }

    return NextResponse.json({ success: true, chunksProcessed: chunks.length, inserted });
  } catch (error: any) {
    console.error("Process Single Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
