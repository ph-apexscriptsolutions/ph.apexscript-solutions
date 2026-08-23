import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import { sendAnnouncementEmailToWorkers } from '@/utils/announcement-email'

export async function GET() {
  try {
    const supabase = getSupabaseServerClient(true)

    const result = await supabase
      .from('assignment_workflow')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (result.error) {
      console.error('Assignment workflow GET error:', result.error)
      return NextResponse.json({ error: result.error.message || 'Failed to fetch assignment workflow' }, { status: 500 })
    }

    return NextResponse.json({ announcements: result.data || [] })
  } catch (err: any) {
    console.error('Assignment workflow GET error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch assignment workflow' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing announcement message' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(true)

    const insertResult = await supabase
      .from('assignment_workflow')
      .insert([{ 
        message: message.trim(), 
        content: message.trim(),
        active: true 
      }])
      .select()
      .single()

    if (insertResult.error) {
      console.error('Assignment workflow POST error:', insertResult.error)
      return NextResponse.json({ error: insertResult.error.message || 'Failed to create assignment workflow' }, { status: 500 })
    }

    // Broadcast to real-time channels
    try {
      await Promise.allSettled([
        supabase.channel('assignment_workflow').send({
          type: 'broadcast',
          event: 'new_assignment_workflow',
          payload: insertResult.data,
        }),
        supabase.channel('announcements').send({
          type: 'broadcast',
          event: 'new_announcement',
          payload: insertResult.data,
        }),
      ])
    } catch (broadcastErr) {
      console.warn('Assignment workflow broadcast failed:', broadcastErr)
    }

    // Send email notifications to all workers via BCC
    const emailDebug = await sendAnnouncementEmailToWorkers({
      supabase,
      categoryTitle: 'Assignment Workflow',
      categoryBadge: 'ASSIGNMENT WORKFLOW',
      message: message.trim(),
    })

    return NextResponse.json({ announcement: insertResult.data, emailDebug })
  } catch (err: any) {
    console.error('Assignment workflow POST error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create assignment workflow' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Missing announcement id' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(true)
    const deleteResult = await supabase
      .from('assignment_workflow')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single()

    if (deleteResult.error) {
      console.error('Assignment workflow DELETE error:', deleteResult.error)
      return NextResponse.json({ error: deleteResult.error.message || 'Failed to delete assignment workflow' }, { status: 500 })
    }

    // Broadcast to real-time channel
    try {
      await supabase.channel('assignment_workflow').send({
        type: 'broadcast',
        event: 'assignment_workflow_deleted',
        payload: deleteResult.data,
      })
    } catch (broadcastErr) {
      console.warn('Assignment workflow broadcast failed:', broadcastErr)
    }

    return NextResponse.json({ announcement: deleteResult.data })
  } catch (err: any) {
    console.error('Assignment workflow DELETE error:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete assignment workflow' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, message } = await request.json()
    if (!id || !message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing announcement id or message' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(true)
    const updateResult = await supabase
      .from('assignment_workflow')
      .update({ message: message.trim(), content: message.trim() })
      .eq('id', id)
      .select()
      .single()

    if (updateResult.error) {
      console.error('Assignment workflow PUT error:', updateResult.error)
      return NextResponse.json({ error: updateResult.error.message || 'Failed to update assignment workflow' }, { status: 500 })
    }

    // Broadcast to real-time channel
    try {
      await supabase.channel('assignment_workflow').send({
        type: 'broadcast',
        event: 'assignment_workflow_updated',
        payload: updateResult.data,
      })
    } catch (broadcastErr) {
      console.warn('Assignment workflow broadcast failed:', broadcastErr)
    }

    return NextResponse.json({ announcement: updateResult.data })
  } catch (err: any) {
    console.error('Assignment workflow PUT error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update assignment workflow' }, { status: 500 })
  }
}
