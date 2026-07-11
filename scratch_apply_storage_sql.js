const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.log("No DATABASE_URL found");
  process.exit(1);
}

const client = new Client({ connectionString });
client.connect().then(() => {
  const fs = require('fs');
  const sql = fs.readFileSync('supabase/18_create_storage.sql', 'utf8');
  client.query(sql)
    .then(() => console.log("Storage SQL applied successfully!"))
    .catch(err => console.error("Error applying SQL:", err))
    .finally(() => client.end());
});
