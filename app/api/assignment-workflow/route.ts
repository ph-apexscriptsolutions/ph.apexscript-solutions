import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import nodemailer from 'nodemailer'

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

    // Broadcast to real-time channel
    try {
      await supabase.channel('assignment_workflow').send({
        type: 'broadcast',
        event: 'new_assignment_workflow',
        payload: insertResult.data,
      })
    } catch (broadcastErr) {
      console.warn('Assignment workflow broadcast failed:', broadcastErr)
    }

    // Send email notifications to all workers
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    if (transporter) {
      try {
        const { data: workers, error: workersError } = await supabase
          .from('worker_profiles')
          .select('email, full_name')

        if (!workersError && workers && workers.length > 0) {
          const workerEmails = workers
            .filter((w: any) => w.email)
            .map((w: any) => `"${w.full_name || 'Worker'}" <${w.email}>`)

          if (workerEmails.length > 0) {
            const result = await transporter.sendMail({
              from: `"[WORKER] ApexScript Transcription Services" <${process.env.EMAIL_USER}>`,
              to: process.env.EMAIL_USER,
              bcc: workerEmails.join(', '),
              subject: '[ASSIGNMENT WORKFLOW] New Assignment Workflow Announcement',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">New Assignment Workflow Announcement</h2>
                  <p style="color: #666; line-height: 1.6;">Please check your dashboard for the latest assignment workflow announcement.</p>
                  <p style="color: #999; font-size: 12px; margin-top: 20px;">
                    This is an automated message from ApexScript Transcription Services.
                  </p>
                </div>
              `,
            })
            console.log('Assignment workflow emails sent successfully. Result:', result)
          }
        } else if (workersError) {
          console.error('Failed to fetch workers for assignment workflow emails:', workersError)
        }
      } catch (emailError) {
        console.error('Failed to send assignment workflow notification emails. Error details:', emailError)
      }
    }

    return NextResponse.json({ announcement: insertResult.data })
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
