import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const { id } = await params

    console.log('[DELETE formatting-rules] ID received:', id)

    if (!id) {
      return NextResponse.json({ error: 'Missing rule id.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { error } = await supabase
      .from('formatting_rules')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete formatting rule error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Formatting rule DELETE error:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete formatting rule' }, { status: 500 })
  }
}
