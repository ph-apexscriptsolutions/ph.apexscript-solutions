import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import nodemailer from 'nodemailer'

// Initialize Nodemailer transporter with Gmail
const transporter = process.env.EMAIL_USER && process.env.EMAIL_PASS 
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null

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
      .order('is_priority', { ascending: false })
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
    const { workerId, filename, dueTime, description, attachmentUrl, isPriority } = body

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
        attachment_url: attachmentUrl || null,
        is_priority: isPriority || false,
      }])
      .select()

    if (error) {
      console.error('Assignment create error:', error)
      return NextResponse.json({ error: error.message || 'Failed to create assignment' }, { status: 500 })
    }

    // Fetch worker's email to send notification (optional)
    const { data: workerData, error: workerError } = await supabase
      .from('worker_profiles')
      .select('email, full_name')
      .eq('id', workerId)
      .single()

    if (!workerError && workerData?.email && transporter) {
      try {
        const subject = isPriority 
          ? '[URGENT] Priority Assignment Available' 
          : '[ALERT] New Assignment Available'
        
        const priorityBadge = isPriority 
          ? `<div style="background: linear-gradient(135deg, #ff6b6b, #ee5a5a); color: white; padding: 12px; border-radius: 8px; margin: 20px 0; text-align: center; font-weight: bold; font-size: 16px;">
              PRIORITY ASSIGNMENT - Complete ASAP
             </div>`
          : ''

        const result = await transporter.sendMail({
          from: `"[WORKER] ApexScript Transcription Services" <ph.apexscriptsolutions@gmail.com>`,
          to: `"${workerData.full_name || 'Worker'}" <${workerData.email}>`,
          subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              ${priorityBadge}
              <h2 style="color: #333;">${isPriority ? 'Priority Assignment' : 'New Assignment Available'}</h2>
              <p style="color: #666; line-height: 1.6;">Hello ${workerData.full_name || 'Worker'},</p>
              <p style="color: #666; line-height: 1.6;">You have a ${isPriority ? '<strong>PRIORITY</strong>' : 'new'} assignment available in your dashboard.</p>
              ${isPriority ? '<p style="color: #e74c3c; line-height: 1.6; font-weight: bold;">Please complete this assignment as soon as possible.</p>' : ''}
              <p style="color: #666; line-height: 1.6;">Please check your dashboard for more details.</p>
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; margin: 0;">This is an automated message. Please do not reply.</p>
            </div>
          `,
        })
        console.log('Assignment email sent successfully to:', workerData.email)
      } catch (emailError) {
        console.error('Failed to send assignment notification email (email notifications skipped):', emailError)
        // Don't fail the request if email sending fails
      }
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
