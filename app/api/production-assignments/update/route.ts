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
    const { assignmentId, status, filename, dueTime, description } = body

    if (!assignmentId) {
      return NextResponse.json({ error: 'Missing assignmentId' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const updates: any = {}
    if (status) updates.status = status
    if (typeof filename !== 'undefined') updates.filename = filename
    if (typeof dueTime !== 'undefined') updates.due_time = dueTime
    if (typeof description !== 'undefined') {
      updates.description = description
      updates.description_updated_at = new Date().toISOString()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No update fields provided' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('production_assignments')
      .update(updates)
      .eq('id', assignmentId)
      .select()

    if (error) {
      console.error('Assignment update error:', error)
      return NextResponse.json({ error: error.message || 'Failed to update assignment' }, { status: 500 })
    }

    return NextResponse.json({ assignment: data?.[0] })
  } catch (err: any) {
    console.error('Assignment update POST error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update assignment' }, { status: 500 })
  }
}
