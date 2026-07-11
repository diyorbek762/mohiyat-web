require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .rpc('get_chunk_counts');

  if (error) {
    // Fallback: manually fetch all and group
    const { data: chunks, err } = await supabase.from('legal_knowledge').select('lex_uz_id');
    const counts = {};
    chunks.forEach(c => {
       counts[c.lex_uz_id] = (counts[c.lex_uz_id] || 0) + 1;
    });
    console.log("Chunk counts by Lex ID:", counts);
    console.log("Total chunks:", chunks.length);
  } else {
    console.log(data);
  }
}
test();
