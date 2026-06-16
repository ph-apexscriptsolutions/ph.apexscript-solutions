import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const { workerId } = await request.json()
    
    if (!workerId) {
      return NextResponse.json({ error: 'Missing workerId' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(true)

    // Try to update last_seen timestamp directly
    const { error } = await supabase
      .from('worker_profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', workerId)

    if (error) {
      // If column doesn't exist, try to add it
      if (error.message?.includes('column') || error.code === 'PGRST204') {
        try {
          const { error: alterError } = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now();'
          })
          if (alterError) {
            console.error('Failed to add last_seen column:', alterError)
            return NextResponse.json({ error: 'Failed to add last_seen column' }, { status: 500 })
          }
          // Retry the update after adding the column
          const { error: retryError } = await supabase
            .from('worker_profiles')
            .update({ last_seen: new Date().toISOString() })
            .eq('id', workerId)
          if (retryError) {
            console.error('Failed to update last_seen after adding column:', retryError)
            return NextResponse.json({ error: 'Failed to update last_seen' }, { status: 500 })
          }
        } catch (alterError) {
          console.error('Failed to add last_seen column:', alterError)
          return NextResponse.json({ error: 'Failed to add last_seen column' }, { status: 500 })
        }
      } else {
        console.error('Failed to update last_seen:', error)
        return NextResponse.json({ error: 'Failed to update last_seen' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Update last_seen error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update last_seen' }, { status: 500 })
  }
}
