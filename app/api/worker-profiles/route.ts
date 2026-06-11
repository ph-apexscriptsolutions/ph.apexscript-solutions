import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data, error } = await supabase.from('worker_profiles').select('id,full_name,email').eq('id', id).single()
    if (error) {
      console.error('Worker profile fetch error:', error)
      return NextResponse.json({ error: error.message || 'Failed to fetch worker profile' }, { status: 500 })
    }

    return NextResponse.json({ profile: data || null })
  } catch (err: any) {
    console.error('Worker profile GET error:', err)
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 })
  }
}
