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
    const { assignmentId } = body

    if (!assignmentId) {
      return NextResponse.json({ error: 'Missing assignmentId' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { error } = await supabase
      .from('production_assignments')
      .update({ admin_deleted: true })
      .eq('id', assignmentId)

    if (error) {
      console.error('Assignment delete error:', error)
      return NextResponse.json({ error: error.message || 'Failed to delete assignment' }, { status: 500 })
    }

    // Broadcast deletion so realtime clients can refresh immediately
    try {
      // fetch the updated row to get worker_id
      const { data: rows } = await supabase.from('production_assignments').select('id,worker_id').eq('id', assignmentId).limit(1)
      const workerId = rows?.[0]?.worker_id
      if (workerId) {
        const channelName = `assignments:${workerId}`
        await supabase.channel(channelName).send({ type: 'broadcast', event: 'assignment_deleted', payload: { id: assignmentId } })
      }
    } catch (broadcastErr) {
      console.warn('Failed to broadcast assignment deletion:', broadcastErr)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Assignment delete POST error:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete assignment' }, { status: 500 })
  }
}
