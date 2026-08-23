import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import { sendAnnouncementEmailToWorkers } from '@/utils/announcement-email'

export async function GET() {
  try {
    const supabase = getSupabaseServerClient(true)

    const result = await supabase
      .from('general_announcements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (result.error) {
      console.error('General announcements GET error:', result.error)
      return NextResponse.json({ error: result.error.message || 'Failed to fetch general announcements' }, { status: 500 })
    }

    return NextResponse.json({ announcements: result.data || [] })
  } catch (err: any) {
    console.error('General announcements GET error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch general announcements' }, { status: 500 })
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
      .from('general_announcements')
      .insert([{ 
        message: message.trim(), 
        content: message.trim(),
        active: true 
      }])
      .select()
      .single()

    if (insertResult.error) {
      console.error('General announcements POST error:', insertResult.error)
      return NextResponse.json({ error: insertResult.error.message || 'Failed to create general announcement' }, { status: 500 })
    }

    // Broadcast to real-time channels
    try {
      await Promise.allSettled([
        supabase.channel('general_announcements').send({
          type: 'broadcast',
          event: 'new_general_announcement',
          payload: insertResult.data,
        }),
        supabase.channel('announcements').send({
          type: 'broadcast',
          event: 'new_announcement',
          payload: insertResult.data,
        }),
      ])
    } catch (broadcastErr) {
      console.warn('General announcements broadcast failed:', broadcastErr)
    }

    // Send email notifications to all workers via BCC
    const emailDebug = await sendAnnouncementEmailToWorkers({
      supabase,
      categoryTitle: 'General Announcement',
      categoryBadge: 'GENERAL ANNOUNCEMENT',
      message: message.trim(),
    })

    return NextResponse.json({ announcement: insertResult.data, emailDebug })
  } catch (err: any) {
    console.error('General announcements POST error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create general announcement' }, { status: 500 })
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
      .from('general_announcements')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single()

    if (deleteResult.error) {
      console.error('General announcements DELETE error:', deleteResult.error)
      return NextResponse.json({ error: deleteResult.error.message || 'Failed to delete general announcement' }, { status: 500 })
    }

    // Broadcast to real-time channel
    try {
      await supabase.channel('general_announcements').send({
        type: 'broadcast',
        event: 'general_announcement_deleted',
        payload: deleteResult.data,
      })
    } catch (broadcastErr) {
      console.warn('General announcements broadcast failed:', broadcastErr)
    }

    return NextResponse.json({ announcement: deleteResult.data })
  } catch (err: any) {
    console.error('General announcements DELETE error:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete general announcement' }, { status: 500 })
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
      .from('general_announcements')
      .update({ message: message.trim(), content: message.trim() })
      .eq('id', id)
      .select()
      .single()

    if (updateResult.error) {
      console.error('General announcements PUT error:', updateResult.error)
      return NextResponse.json({ error: updateResult.error.message || 'Failed to update general announcement' }, { status: 500 })
    }

    // Broadcast to real-time channel
    try {
      await supabase.channel('general_announcements').send({
        type: 'broadcast',
        event: 'general_announcement_updated',
        payload: updateResult.data,
      })
    } catch (broadcastErr) {
      console.warn('General announcements broadcast failed:', broadcastErr)
    }

    return NextResponse.json({ announcement: updateResult.data })
  } catch (err: any) {
    console.error('General announcements PUT error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update general announcement' }, { status: 500 })
  }
}
