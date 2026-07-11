const { createClient } = require('@supabase/supabase-js');
global.WebSocket = require('ws');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Direct postgres query using pg
const { Client } = require('pg');
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.log("No DATABASE_URL found");
  process.exit(1);
}

const client = new Client({ connectionString });
client.connect().then(() => {
  const fs = require('fs');
  const sql = fs.readFileSync('supabase/17_performance_indexes.sql', 'utf8');
  client.query(sql)
    .then(() => console.log("Indexes applied successfully!"))
    .catch(err => console.error("Error applying indexes:", err))
    .finally(() => client.end());
});
