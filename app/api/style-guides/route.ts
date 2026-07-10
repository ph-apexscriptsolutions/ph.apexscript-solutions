import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data, error } = await supabase
      .from('style_guides')
      .select('id, department, file_url, file_name, note, updated_at')
      .order('department')

    if (error) {
      console.error('Style guides fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, guides: data || [] })
  } catch (err: any) {
    console.error('Style guides GET error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch style guides' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const { department, note } = await request.json()

    if (!department || typeof note !== 'string') {
      return NextResponse.json({ error: 'Missing department or note.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Ensure the note column exists; if not, the error will surface naturally
    const { error } = await supabase
      .from('style_guides')
      .update({ note: note.trim() })
      .eq('department', department)

    if (error) {
      console.error('Style guide note update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Style guide PATCH error:', err)
    return NextResponse.json({ error: err.message || 'Failed to save note' }, { status: 500 })
  }
}
