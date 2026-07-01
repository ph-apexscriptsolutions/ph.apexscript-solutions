const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addLastSeenColumn() {
  try {
    console.log('Checking if last_seen column exists...')
    
    // Try to select the last_seen column
    const { data, error } = await supabase
      .from('worker_profiles')
      .select('last_seen')
      .limit(1)
    
    if (error) {
      console.log('Column does not exist, adding it...')
      
      // Add the column using raw SQL
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now();'
      })
      
      if (alterError) {
        console.error('Failed to add column:', alterError)
        return
      }
      
      console.log('✅ last_seen column added successfully')
    } else {
      console.log('✅ last_seen column already exists')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

addLastSeenColumn()
