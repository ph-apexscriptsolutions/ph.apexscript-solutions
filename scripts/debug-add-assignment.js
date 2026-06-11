const fs = require('fs')
const path = require('path')
;(async () => {
  try {
    const envPath = path.join(__dirname, '..', '.env.local')
    if (!fs.existsSync(envPath)) {
      console.error('.env.local not found')
      process.exit(1)
    }
    const env = fs.readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
      .reduce((acc, line) => {
        const [k, ...rest] = line.split('=')
        acc[k] = rest.join('=')
        return acc
      }, {})

    const SUPABASE_URL = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
      process.exit(1)
    }

    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    console.log('Fetching one worker profile...')
    const { data: workers, error: wErr } = await supabase.from('worker_profiles').select('id,full_name').limit(1)
    if (wErr) {
      console.error('Error fetching workers:', wErr)
      process.exit(1)
    }
    if (!workers || workers.length === 0) {
      console.error('No workers found')
      process.exit(1)
    }
    const worker = workers[0]
    console.log('Using worker:', worker)

    const filename = `debug-test-${Date.now()}.txt`
    console.log('Inserting assignment for', worker.id, filename)
    const { data, error } = await supabase.from('production_assignments').insert([{ worker_id: worker.id, filename, status: 'pending' }]).select()
    if (error) {
      console.error('Insert error:', error)
      process.exit(1)
    }
    console.log('Insert result:', data)
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()
