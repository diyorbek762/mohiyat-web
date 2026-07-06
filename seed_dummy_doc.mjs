import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ocvkntliwfusbwlekzjd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jdmtudGxpd2Z1c2J3bGVrempkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjExNTY4NCwiZXhwIjoyMDk3NjkxNjg0fQ.CsxzWtTHIPHQ7YRn_5s9CD7Cc4V7a-iDlmwS2pZyUq0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fetching users...');
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError || !users.users || users.users.length === 0) {
    console.error('Failed to fetch users or no users found.', userError);
    return;
  }

  // Get the first user
  const userId = users.users[0].id;
  console.log('Seeding dummy scan session for user:', userId);

  const dummyReport = {
    short_title: "Ijara Shartnomasi (Namuna)",
    overall_summary: "Bu test uchun yaratilgan namuna shartnoma tahlili. Unda bir nechta xavfli bandlar mavjud.",
    risk_score: 85,
    blind_spots: [
      {
        title: "Asossiz jarima miqdori",
        severity: "high",
        section_ref: "3.2-band",
        legal_basis: "FK 326-moddasi. Neystoyka miqdori oqibatlarga mutanosib bo'lishi kerak.",
        recommendation: "Jarimani kunlik 0.5% dan 0.1% gacha tushirish tavsiya etiladi."
      },
      {
        title: "Ijaraga beruvchining bir tomonlama bekor qilish huquqi",
        severity: "high",
        section_ref: "5.1-band",
        legal_basis: "FK 605-moddasi. Faqat sud orqali yoki shartnomadagi qat'iy asoslar bilan bekor qilinishi mumkin.",
        recommendation: "Bekor qilish uchun ogohlantirish muddatini kamida 30 kun qilib belgilash kerak."
      },
      {
        title: "Ta'mirlash xarajatlari oydinlashtirilmagan",
        severity: "medium",
        section_ref: "4.4-band",
        legal_basis: "FK 544-moddasi.",
        recommendation: "Kapital ta'mir kimning hisobidan qilinishini aniq yozib qo'yish kerak."
      }
    ]
  };

  const { data: inserted, error: insertError } = await supabase
    .from('scan_sessions')
    .insert({
      user_id: userId,
      file_name: "test_ijara_shartnomasi.pdf",
      file_hash: "dummy_hash_123",
      detected_domain: "ijara",
      short_title: "Ijara Shartnomasi (Namuna)",
      risk_score: 85,
      full_report: dummyReport,
      status: "unlocked",
      llm_model_used: "seed",
      processing_ms: 1200
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error inserting dummy document:', insertError);
  } else {
    console.log('Successfully inserted dummy document! Session ID:', inserted.id);
    
    console.log('Inserting dummy chat messages for testing...');
    await supabase.from('chat_messages').insert([
      {
        session_id: inserted.id,
        user_id: userId,
        role: 'user',
        content: 'Salom, ushbu shartnomadagi eng katta xavf nima?'
      },
      {
        session_id: inserted.id,
        user_id: userId,
        role: 'assistant',
        content: 'Assalomu alaykum! Ushbu shartnomadagi eng katta xavf 3.2-banddagi asossiz katta jarima (penya) miqdoridir. Uni O\'zbekiston qonunchiligiga mos ravishda 0.1% ga tushirishni tavsiya qilaman.'
      }
    ]);
    console.log('Successfully inserted dummy chat messages!');
  }
}

main();
