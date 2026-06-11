import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const { workerId } = await request.json()
    if (!workerId) {
      return NextResponse.json({ error: 'Missing worker ID.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { error: recordsError } = await supabase.from('production_records').delete().eq('worker_id', workerId)
    if (recordsError) {
      return NextResponse.json({ error: recordsError.message ?? 'Failed to delete worker production records.' }, { status: 500 })
    }

    const { error: profileError } = await supabase.from('worker_profiles').delete().eq('id', workerId)
    if (profileError) {
      return NextResponse.json({ error: profileError.message ?? 'Failed to delete worker profile.' }, { status: 500 })
    }

    const { error: authError } = await supabase.auth.admin.deleteUser(workerId)
    if (authError) {
      return NextResponse.json({ error: authError.message ?? 'Failed to delete auth user.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete worker exception:', error)
    return NextResponse.json({ error: error?.message ?? 'Failed to delete worker.' }, { status: 500 })
  }
}
