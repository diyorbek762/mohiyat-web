import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: allSessions, error: allErr } = await supabase.from('scan_sessions').select('id, user_id, status').limit(10);
  
  const { data: policies, error: polErr } = await supabase.rpc('debug_rls') || { data: null }; // Will probably fail but let's try
  
  return NextResponse.json({
    allSessionsCount: allSessions?.length || 0,
    allSessions: allSessions || [],
    error: allErr?.message,
    env: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  });
}
