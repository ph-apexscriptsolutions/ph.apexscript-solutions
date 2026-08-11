const { Client } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.POSTGRES_PASSWORD;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('ERROR: Missing SUPABASE_URL');
    process.exit(1);
  }

  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectId) {
    console.error('ERROR: Could not parse project ID from SUPABASE_URL:', supabaseUrl);
    process.exit(1);
  }

  // Attempt direct postgres connection strings
  const connectionStrings = [
    process.env.DATABASE_URL,
    dbPassword ? `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectId}.supabase.co:5432/postgres` : null,
    serviceRoleKey ? `postgresql://postgres.${projectId}:${encodeURIComponent(serviceRoleKey)}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres` : null,
    `postgresql://postgres:${encodeURIComponent(serviceRoleKey)}@db.${projectId}.supabase.co:5432/postgres`
  ].filter(Boolean);

  let client = null;
  let connected = false;

  for (const connStr of connectionStrings) {
    try {
      console.log('Attempting connection to Supabase DB...');
      client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
      await client.connect();
      connected = true;
      console.log('✅ Connected successfully to Supabase Postgres!');
      break;
    } catch (err) {
      console.warn('Connection failed with connection string, trying next...', err.message);
    }
  }

  if (!connected || !client) {
    console.error('❌ Could not connect via pg directly. Please run SQL manually in Supabase SQL Editor.');
    process.exit(1);
  }

  const sql = `
    CREATE TABLE IF NOT EXISTS public.priority_announcements (
      id serial PRIMARY KEY,
      admin_id text,
      admin_name text DEFAULT 'Admin',
      title text NOT NULL,
      description text NOT NULL DEFAULT '',
      target_type text NOT NULL DEFAULT 'all',
      target_worker_ids jsonb DEFAULT '[]'::jsonb,
      first_come_first_served boolean NOT NULL DEFAULT false,
      status text NOT NULL DEFAULT 'active',
      claimed_by_worker_id text,
      claimed_by_worker_name text,
      expires_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public.priority_announcement_responses (
      id serial PRIMARY KEY,
      announcement_id integer REFERENCES public.priority_announcements(id) ON DELETE CASCADE,
      worker_id text NOT NULL,
      worker_name text NOT NULL DEFAULT '',
      worker_email text DEFAULT '',
      response text NOT NULL,
      note text DEFAULT '',
      responded_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_priority_announcements_status ON public.priority_announcements(status);
    CREATE INDEX IF NOT EXISTS idx_priority_announcements_created ON public.priority_announcements(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_priority_responses_announcement ON public.priority_announcement_responses(announcement_id);
    CREATE INDEX IF NOT EXISTS idx_priority_responses_worker ON public.priority_announcement_responses(worker_id);

    NOTIFY pgrst, 'reload schema';
  `;

  try {
    await client.query(sql);
    console.log('✅ priority_announcements & priority_announcement_responses tables created successfully!');
    console.log('✅ PostgREST schema cache reloaded!');
  } catch (err) {
    console.error('SQL Execution Error:', err);
  } finally {
    await client.end();
  }
}

run();
