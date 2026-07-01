const { Client } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.local') });

async function runMigration() {
  const supabaseUrl = process.env.SUPABASE_URL;
  
  if (!supabaseUrl) {
    console.error('ERROR: Missing SUPABASE_URL');
    process.exit(1);
  }

  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  if (!projectId) {
    console.error('ERROR: Could not parse SUPABASE_URL');
    process.exit(1);
  }

  const connectionString = `postgresql://postgres:${process.env.SUPABASE_SERVICE_ROLE_KEY}@db.${projectId}.supabase.co:5432/postgres`;

  const client = new Client({ connectionString });

  console.log('🚀 Running migration for payment_history...\n');

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sql = `
      CREATE TABLE IF NOT EXISTS public.payment_history (
        id serial PRIMARY KEY,
        worker_id text NOT NULL,
        amount numeric(10, 2) NOT NULL,
        payment_date date NOT NULL DEFAULT CURRENT_DATE,
        reference_number text,
        notes text,
        created_at timestamptz NOT NULL DEFAULT now(),
        admin_deleted boolean DEFAULT false
      );

      CREATE INDEX IF NOT EXISTS idx_payment_history_worker_id ON public.payment_history(worker_id);
    `;

    await client.query(sql);
    console.log('✅ Migration completed successfully!\n');
    console.log('Created table: public.payment_history');
    console.log('Created index: idx_payment_history_worker_id');

    await client.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

runMigration();
