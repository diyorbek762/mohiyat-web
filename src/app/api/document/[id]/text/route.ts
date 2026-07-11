import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptBuffer } from '@/lib/encryption';
import pdfParse from 'pdf-parse';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const sessionId = resolvedParams.id;
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: sessionData, error: sessionError } = await adminSupabase
      .from('scan_sessions')
      .select('full_report, file_name')
      .eq('id', sessionId)
      .single();
      
    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (sessionData.full_report?.document_text) {
      return NextResponse.json({ text: sessionData.full_report.document_text });
    }

    const documentPath = sessionData.full_report?.document_path;
    if (!documentPath) {
      return NextResponse.json({ error: 'Document file not found' }, { status: 404 });
    }

    // Download encrypted file
    const { data: fileData, error: downloadError } = await adminSupabase
      .storage
      .from('documents')
      .download(documentPath);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Failed to download document' }, { status: 500 });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const encryptedBuffer = Buffer.from(arrayBuffer);
    const decryptedBuffer = decryptBuffer(encryptedBuffer);

    const ext = sessionData.file_name.split('.').pop()?.toLowerCase();
    let text = "";

    if (ext === 'pdf') {
      try {
        const pdfData = await pdfParse(decryptedBuffer);
        text = pdfData.text;
      } catch (e) {
        console.error("PDF parse failed:", e);
      }
    } else if (ext === 'txt') {
      text = decryptedBuffer.toString('utf8');
    } else {
       return NextResponse.json({ error: 'Fayl matnini ajratib bo\'lmaydigan formatda (masalan, rasm).' }, { status: 400 });
    }

    // Cache the extracted text back into the database
    if (text) {
       const updatedReport = { ...sessionData.full_report, document_text: text };
       await adminSupabase
         .from('scan_sessions')
         .update({ full_report: updatedReport })
         .eq('id', sessionId);
    }

    return NextResponse.json({ text });

  } catch (err: any) {
    console.error("Document API Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
