const { createClient } = require('@supabase/supabase-js');
global.WebSocket = require('ws');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateBucket() {
  console.log("Updating 'documents' bucket allowedMimeTypes...");
  const { data, error } = await supabase.storage.updateBucket('documents', {
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/octet-stream'],
  });
  
  if (error) {
    console.error("Failed to update bucket:", error);
  } else {
    console.log("Bucket updated successfully!");
  }
}

updateBucket();
