const { createClient } = require('@supabase/supabase-js');
global.WebSocket = require('ws');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Supabase credentials not found in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupBucket() {
  console.log("Checking for 'documents' bucket...");
  
  const { data: buckets, error: getError } = await supabase.storage.listBuckets();
  if (getError) {
    console.error("Error fetching buckets:", getError);
    process.exit(1);
  }
  
  const exists = buckets.find(b => b.name === 'documents');
  if (exists) {
    console.log("✅ Bucket 'documents' already exists.");
  } else {
    console.log("Bucket 'documents' not found. Creating it now...");
    const { data, error } = await supabase.storage.createBucket('documents', {
      public: false,
      allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (error) {
      console.error("❌ Failed to create bucket:", error);
    } else {
      console.log("✅ Bucket 'documents' created successfully!");
    }
  }
}

setupBucket();
