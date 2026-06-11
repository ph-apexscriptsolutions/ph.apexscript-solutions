const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(process.cwd(), '.env.local');
const envContents = fs.readFileSync(envPath, 'utf8');
const env = envContents
  .split(/\r?\n/)
  .filter(Boolean)
  .reduce((acc, line) => {
    const [key, ...rest] = line.split('=');
    acc[key] = rest.join('=');
    return acc;
  }, {});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const migrationSql = `ALTER TABLE public.worker_profiles
ADD COLUMN IF NOT EXISTS bank_name text;

ALTER TABLE public.worker_profiles
ADD COLUMN IF NOT EXISTS account_number text;

ALTER TABLE public.worker_profiles
ADD COLUMN IF NOT EXISTS account_type text;

ALTER TABLE public.worker_profiles
ADD COLUMN IF NOT EXISTS routing_number text;`;

(async () => {
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('id,account_number,bank_name,account_type,routing_number')
    .limit(1);

  if (error) {
    console.log('Schema check failed:')
    console.log(error)

    if (error.code === '42703') {
      console.log('\nThe worker_profiles table is missing one or more bank detail columns.')
      console.log('Run the SQL below in your Supabase SQL editor:')
      console.log('---')
      console.log(migrationSql)
      console.log('---')
    }
    return
  }

  console.log('Schema check passed. worker_profiles contains bank detail columns.')
  console.log('Sample row:', JSON.stringify(data?.[0] ?? {}, null, 2))
})();
