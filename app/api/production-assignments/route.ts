import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServerClient(true)

    const url = new URL(request.url)
    const workerId = url.searchParams.get('workerId')

    if (!workerId) {
      return NextResponse.json({ error: 'Missing workerId' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('production_assignments')
      .select('*')
      .eq('worker_id', workerId)
      .eq('admin_deleted', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Assignments fetch error:', error)
      return NextResponse.json({ error: error.message || 'Failed to fetch assignments' }, { status: 500 })
    }

    return NextResponse.json({ assignments: data || [] })
  } catch (err: any) {
    console.error('Assignments GET error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch assignments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { workerId, filename, dueTime, description } = body

    if (!workerId || !filename) {
      return NextResponse.json({ error: 'Missing workerId or filename' }, { status: 400 })
    }

    const formattedDueTime = dueTime || null

    const supabase = getSupabaseServerClient(true)

    const { data, error } = await supabase
      .from('production_assignments')
      .insert([{ 
        worker_id: workerId, 
        filename, 
        status: 'pending',
        due_time: formattedDueTime,
        description: description || null,
      }])
      .select()

    if (error) {
      console.error('Assignment create error:', error)
      return NextResponse.json({ error: error.message || 'Failed to create assignment' }, { status: 500 })
    }

    // Broadcast a lightweight notification to realtime clients subscribed to this worker's channel
    try {
      const channelName = `assignments:${workerId}`
      await supabase.channel(channelName).send({ type: 'broadcast', event: 'new_assignment', payload: data?.[0] })
    } catch (broadcastErr) {
      console.warn('Failed to broadcast new assignment:', broadcastErr)
    }

    return NextResponse.json({ assignment: data?.[0] })
  } catch (err: any) {
    console.error('Assignments POST error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create assignment' }, { status: 500 })
  }
}
