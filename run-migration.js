const { Client } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

async function runMigration() {
  const supabaseUrl = process.env.SUPABASE_URL;
  
  if (!supabaseUrl) {
    console.error('ERROR: Missing SUPABASE_URL');
    process.exit(1);
  }

  // Extract connection info from Supabase URL
  // Format: https://[project-id].supabase.co
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  if (!projectId) {
    console.error('ERROR: Could not parse SUPABASE_URL');
    process.exit(1);
  }

  const connectionString = `postgresql://postgres:${process.env.SUPABASE_SERVICE_ROLE_KEY}@db.${projectId}.supabase.co:5432/postgres`;

  const client = new Client({ connectionString });

  console.log('🚀 Running migration...\n');

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sql = `
      ALTER TABLE IF EXISTS public.production_assignments
      ADD COLUMN IF NOT EXISTS due_time text,
      ADD COLUMN IF NOT EXISTS description text;
    `;

    await client.query(sql);
    console.log('✅ Migration completed successfully!\n');
    console.log('Added columns:');
    console.log('  - due_time (text)');
    console.log('  - description (text)');

    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

runMigration();
