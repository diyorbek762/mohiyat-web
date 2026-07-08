import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-internal-secret");
    if (secret !== (process.env.INTERNAL_SECRET || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { lexId, title, chunks } = await req.json();
    if (!lexId || !chunks) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const batchRequests = chunks.map((chunk: string) => ({
      model: "models/gemini-embedding-2",
      content: { parts: [{ text: chunk }] }
    }));

    const embeddingRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents?key=${process.env.GOOGLE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requests: batchRequests })
    });

    if (!embeddingRes.ok) {
       console.error("Gemini Batch Embedding failed:", await embeddingRes.text());
       return NextResponse.json({ error: "Embedding Failed" }, { status: 500 });
    }

    const embeddingData = await embeddingRes.json();
    
    const insertData = embeddingData.embeddings.map((emb: any, idx: number) => ({
      lex_uz_id: lexId,
      title: title,
      content_chunk: chunks[idx],
      category: "General",
      embedding: emb.values,
    }));

    const { error: insertErr } = await supabase.from('legal_knowledge').insert(insertData);
    if (insertErr) throw insertErr;

    return NextResponse.json({ success: true, inserted: chunks.length });
  } catch (error: any) {
    console.error("Embed Batch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
