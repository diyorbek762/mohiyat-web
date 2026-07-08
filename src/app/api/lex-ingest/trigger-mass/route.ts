import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@upstash/qstash';

// Initialize QStash Client
const qstash = new Client({
  token: process.env.QSTASH_TOKEN || '',
});

export async function POST(req: NextRequest) {
  try {
    // Basic auth check
    const secret = req.headers.get("x-internal-secret");
    if (secret !== (process.env.INTERNAL_SECRET || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // "Big Bang" IDs: Here we hardcode the Lex.uz IDs for Core Codes (Soliq, Fuqarolik, Mehnat)
    // 3855658 - Mehnat kodeksi
    // 4124376 - Soliq kodeksi
    // 111189  - Fuqarolik kodeksi 1-qism
    // 163971  - Fuqarolik kodeksi 2-qism
    const coreLexIds = ["3855658", "4124376", "111189", "163971"];
    
    // In a real scenario for daily cron, we would fetch RSS feed and get new IDs.
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mohiyatai.com"; // Adjust accordingly

    // Queue tasks in Upstash QStash
    const publishPromises = coreLexIds.map(id => {
      return qstash.publishJSON({
        url: `${baseUrl}/api/lex-ingest/process-single`,
        body: { lexId: id },
        headers: {
          "x-internal-secret": process.env.INTERNAL_SECRET || ""
        }
      });
    });

    await Promise.all(publishPromises);

    return NextResponse.json({ 
      success: true, 
      message: `Triggered ${coreLexIds.length} legal documents for asynchronous ingestion.` 
    });
  } catch (error: any) {
    console.error("Trigger Mass Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
