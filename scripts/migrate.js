const { readFileSync, existsSync } = require('fs')
const { resolve } = require('path')

const MIGRATIONS = [
  `ALTER TABLE public.worker_profiles
    ADD COLUMN IF NOT EXISTS bank_name text,
    ADD COLUMN IF NOT EXISTS account_number text,
    ADD COLUMN IF NOT EXISTS account_type text,
    ADD COLUMN IF NOT EXISTS routing_number text,
    ADD COLUMN IF NOT EXISTS profile_picture_url text,
    ADD COLUMN IF NOT EXISTS email text,
    ADD COLUMN IF NOT EXISTS location text;`,

  `ALTER TABLE public.worker_profiles
    ADD COLUMN IF NOT EXISTS base_payment_per_60kb integer DEFAULT 700;`,

  `ALTER TABLE public.worker_profiles
    DROP COLUMN IF EXISTS comment;`,

  `UPDATE public.worker_profiles
    SET base_payment_per_60kb = 700
    WHERE base_payment_per_60kb IS NULL;`
,
  `ALTER TABLE IF EXISTS public.announcements
    ADD COLUMN IF NOT EXISTS message text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS admin_id text;
  ALTER TABLE IF EXISTS public.announcements
    ALTER COLUMN admin_id DROP NOT NULL;`,
  `CREATE TABLE IF NOT EXISTS public.payslip_requests (
    id serial PRIMARY KEY,
    worker_id text NOT NULL,
    cutoff_start date NOT NULL,
    cutoff_end date NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    requested_at timestamptz NOT NULL DEFAULT now()
  );`,
  `ALTER TABLE public.payslip_requests
    ADD COLUMN IF NOT EXISTS payslip_url text;`
,
  `ALTER TABLE public.payslip_requests
    ADD COLUMN IF NOT EXISTS admin_deleted boolean DEFAULT false;`,
  
  `CREATE TABLE IF NOT EXISTS public.production_assignments (
    id serial PRIMARY KEY,
    worker_id text NOT NULL,
    filename text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    admin_deleted boolean DEFAULT false
  );`,
  
  `CREATE INDEX IF NOT EXISTS idx_production_assignments_worker_id ON public.production_assignments(worker_id);`,
  
  `CREATE TABLE IF NOT EXISTS public.dashboard_layout_settings (
    id serial PRIMARY KEY,
    assignment_header_template text NOT NULL DEFAULT '3fr 1fr 1fr',
    assignment_row_template text NOT NULL DEFAULT '3fr 1fr 1fr'
  );`,
  `CREATE TABLE IF NOT EXISTS public.payment_history (
    id serial PRIMARY KEY,
    worker_id text NOT NULL,
    amount numeric(10, 2) NOT NULL,
    payment_date date NOT NULL DEFAULT CURRENT_DATE,
    bank_type text,
    reference_number text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    admin_deleted boolean DEFAULT false
  );
  CREATE INDEX IF NOT EXISTS idx_payment_history_worker_id ON public.payment_history(worker_id);`,
  `ALTER TABLE public.worker_profiles
    ADD COLUMN IF NOT EXISTS weekly_availability jsonb;`
]

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return
  const contents = readFileSync(filePath, 'utf8')
  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const equalsIndex = trimmed.indexOf('=')
    if (equalsIndex === -1) return
    const key = trimmed.slice(0, equalsIndex).trim()
    let value = trimmed.slice(equalsIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = value
    }
  })
}

async function run() {
  const root = resolve(__dirname, '..')
  loadEnvFile(resolve(root, '.env.local'))
  loadEnvFile(resolve(root, '.env'))

  const supabaseUrl = process.env.SUPABASE_URL

  if (!supabaseUrl) {
    console.error('\nERROR: Missing SUPABASE_URL in .env.local')
    process.exit(1)
  }

  console.log('📝 Supabase SQL Migrations')
  console.log('=' .repeat(50))
  console.log('\nTo apply these migrations, go to your Supabase dashboard:\n')
  console.log(`1. Open: ${supabaseUrl}`)
  console.log('2. Go to SQL Editor (left sidebar)')
  console.log('3. Create a new query')
  console.log('4. Copy and paste the SQL below:')
  console.log('\n' + '='.repeat(50))
  console.log('\n')

  // Output all migrations as one SQL block
  for (let i = 0; i < MIGRATIONS.length; i++) {
    console.log(`-- Migration ${i + 1}`)
    console.log(MIGRATIONS[i])
    if (i < MIGRATIONS.length - 1) {
      console.log('\n')
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('\n✅ After running the SQL above, the migrations will be applied.')
  console.log('💡 Note: The admin_deleted column for payslip_requests is now required for delete functionality.\n')
}

run()
