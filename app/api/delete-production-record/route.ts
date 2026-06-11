import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const body = await request.json()
    const recordId = body.recordId as string
    if (!recordId) {
      return NextResponse.json({ error: 'Missing record ID.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { error } = await supabase.from('production_records').delete().eq('id', recordId)
    if (error) {
      console.error('Delete production record error:', error)
      return NextResponse.json({ error: error.message || 'Failed to delete production record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete production record exception:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete production record' }, { status: 500 })
  }
}
