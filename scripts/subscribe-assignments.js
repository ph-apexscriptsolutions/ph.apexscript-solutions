const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

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

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL
const SUPABASE_ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const workerId = process.argv[2]
if (!workerId) {
  console.error('Usage: node subscribe-assignments.js <workerId>')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, { realtime: { params: { /* none */ } } })

const channelName = `assignments:${workerId}`
console.log('Subscribing to', channelName)

const channel = supabase.channel(channelName)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'production_assignments', filter: `worker_id=eq.${workerId}` }, (payload) => {
    console.log('[postgres_changes]', JSON.stringify(payload, null, 2))
  })
  .on('broadcast', { event: '*' }, (payload) => {
    console.log('[broadcast]', JSON.stringify(payload, null, 2))
  })
  .subscribe((status) => {
    console.log('subscribe status:', status)
  })

process.on('SIGINT', async () => {
  console.log('unsubscribing')
  await supabase.removeChannel(channel)
  process.exit(0)
})

// keep process alive
setInterval(() => {}, 1000)
