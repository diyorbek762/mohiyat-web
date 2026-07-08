import { NextRequest, NextResponse } from 'next/server';
import { Client } from "@upstash/qstash";

export const maxDuration = 300; 

const qstash = new Client({ token: process.env.QSTASH_TOKEN || "" });

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-internal-secret") || req.headers.get("Upstash-Forward-x-internal-secret");
    if (secret !== (process.env.INTERNAL_SECRET || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { lexId } = await req.json();
    if (!lexId) return NextResponse.json({ error: "lexId missing" }, { status: 400 });

    const lexUrl = `https://lex.uz/uz/docs/${lexId}`;
    const res = await fetch(lexUrl);
    if (!res.ok) throw new Error(`Failed to fetch ${lexUrl}`);
    
    let html = await res.text();
    
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(' - Lex.uz', '').trim() : `Lex.uz Document ${lexId}`;
    
    let rawText = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    rawText = rawText.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    rawText = rawText.replace(/<[^>]*>?/gm, ' ');
    rawText = rawText.replace(/\s+/g, ' ').trim();

    const CHUNK_SIZE = 2000;
    const chunks = [];
    for (let i = 0; i < rawText.length; i += CHUNK_SIZE) {
      chunks.push(rawText.substring(i, i + CHUNK_SIZE));
    }

    // Distribute via QStash in batches
    const BATCH_SIZE = 50; 
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mohiyatai.com";
    
    const publishPromises = [];
    let delaySeconds = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + BATCH_SIZE);
      
      publishPromises.push(
        qstash.publishJSON({
          url: `${baseUrl}/api/lex-ingest/embed-batch`,
          body: { lexId, title, chunks: batchChunks },
          headers: {
            "Upstash-Forward-x-internal-secret": process.env.INTERNAL_SECRET || ""
          },
          delay: delaySeconds
        })
      );
      
      delaySeconds += 5; // Delay next batch by 5 seconds to bypass 15 RPM limit
    }

    await Promise.all(publishPromises);

    return NextResponse.json({ success: true, chunksDistributed: chunks.length, batches: publishPromises.length });
  } catch (error: any) {
    console.error("Process Single Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
