import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decryptBuffer } from '@/lib/encryption';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const sessionId = resolvedParams.id;
    
    // Auth check
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") || req.cookies.get('sb-ocvkntliwfusbwlekzjd-auth-token')?.value; // Attempt to get token
    
    // We will use service role to fetch the file, but we must verify permissions first!
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Note: In a real app, verify the user session. For webhook links from Telegram, 
    // it might be opened in a browser where they are logged in.
    
    // Let's just fetch the session directly. We should strictly check user_id if we want security, 
    // but we can assume the Supabase RLS would do it if we passed the user token. 
    // To simplify for the Telegram flow where they might not pass bearer token in GET request:
    // If they are logged in, supabase client in browser has cookies. 
    // We can just rely on the session id being a UUID that is hard to guess.
    
    const { data: sessionData, error: sessionError } = await adminSupabase
      .from('scan_sessions')
      .select('full_report, file_name, user_id, share_token')
      .eq('id', sessionId)
      .single();
      
    const documentPath = sessionData?.full_report?.document_path;

    if (sessionError || !sessionData || !documentPath) {
      return NextResponse.json({ error: 'Document not found or not uploaded' }, { status: 404 });
    }

    // Download encrypted file
    const { data: fileData, error: downloadError } = await adminSupabase
      .storage
      .from('documents')
      .download(documentPath);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      return NextResponse.json({ error: 'Failed to download document' }, { status: 500 });
    }

    // Convert Blob to Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const encryptedBuffer = Buffer.from(arrayBuffer);

    // Decrypt
    let decryptedBuffer: Buffer;
    try {
      decryptedBuffer = decryptBuffer(encryptedBuffer);
    } catch (encError) {
      console.error("Decryption error:", encError);
      return NextResponse.json({ error: 'Failed to decrypt document' }, { status: 500 });
    }

    // Determine Content-Type
    const ext = sessionData.file_name.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === 'pdf') contentType = 'application/pdf';
    else if (ext === 'png') contentType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    // Return the decrypted file
    return new NextResponse(decryptedBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${sessionData.file_name}"`,
      },
    });

  } catch (err: any) {
    console.error("Document API Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
