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
    const department = body.department as string | undefined

    if (!department) {
      return NextResponse.json({ error: 'Missing department.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { error } = await supabase
      .from('style_guides')
      .update({ file_url: null, file_name: null, updated_at: new Date().toISOString() })
      .eq('department', department)

    if (error) {
      console.error('Style guide delete error:', error)
      return NextResponse.json({ error: error.message || 'Failed to remove style guide.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Style guide delete POST error:', err)
    return NextResponse.json({ error: err.message || 'Failed to remove style guide' }, { status: 500 })
  }
}
