import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import nodemailer from 'nodemailer'

export async function GET() {
  try {
    const supabase = getSupabaseServerClient(true)

    const result = await supabase
      .from('website_updates')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (result.error) {
      console.error('Website updates GET error:', result.error)
      return NextResponse.json({ error: result.error.message || 'Failed to fetch website updates' }, { status: 500 })
    }

    return NextResponse.json({ announcements: result.data || [] })
  } catch (err: any) {
    console.error('Website updates GET error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch website updates' }, { status: 500 })
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
      .from('website_updates')
      .insert([{ 
        message: message.trim(), 
        content: message.trim(),
        active: true 
      }])
      .select()
      .single()

    if (insertResult.error) {
      console.error('Website updates POST error:', insertResult.error)
      return NextResponse.json({ error: insertResult.error.message || 'Failed to create website update' }, { status: 500 })
    }

    // Broadcast to real-time channel
    try {
      await supabase.channel('website_updates').send({
        type: 'broadcast',
        event: 'new_website_update',
        payload: insertResult.data,
      })
    } catch (broadcastErr) {
      console.warn('Website updates broadcast failed:', broadcastErr)
    }

    // Send email notifications to all workers (optional)
    let emailDebug = {
      emailConfigured: false,
      workersFound: 0,
      workersWithEmail: 0,
      emailSent: false,
      error: null as string | null
    }

    try {
      emailDebug.emailConfigured = !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS)
      
      if (emailDebug.emailConfigured) {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        })

        const { data: workers, error: workersError } = await supabase
          .from('worker_profiles')
          .select('email, full_name')

        if (!workersError && workers && workers.length > 0) {
          emailDebug.workersFound = workers.length
          const workerEmails = workers
            .filter((w: any) => w.email)
            .map((w: any) => `"${w.full_name || 'Worker'}" <${w.email}>`)

          emailDebug.workersWithEmail = workerEmails.length

          if (workerEmails.length > 0) {
            const result = await transporter.sendMail({
              from: `"[WORKER] ApexScript Transcription Services" <ph.apexscriptsolutions@gmail.com>`,
              to: 'ph.apexscriptsolutions@gmail.com',
              bcc: workerEmails.join(', '),
              subject: '[WEBSITE UPDATE] New Website Update from Admin',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">New Website Update</h2>
                  <p style="color: #666; line-height: 1.6;">Please check your dashboard for the latest website update announcement.</p>
                  <p style="color: #999; font-size: 12px; margin-top: 20px;">
                    This is an automated message from ApexScript Transcription Services.
                  </p>
                </div>
              `,
            })
            emailDebug.emailSent = true
          }
        }
      } else {
        emailDebug.error = 'Email environment variables not configured (email notifications skipped)'
      }
    } catch (emailError: any) {
      emailDebug.error = `Email sending failed: ${emailError.message}`
    }

    return NextResponse.json({ announcement: insertResult.data, emailDebug })
  } catch (err: any) {
    console.error('Website updates POST error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create website update' }, { status: 500 })
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
      .from('website_updates')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single()

    if (deleteResult.error) {
      console.error('Website updates DELETE error:', deleteResult.error)
      return NextResponse.json({ error: deleteResult.error.message || 'Failed to delete website update' }, { status: 500 })
    }

    // Broadcast to real-time channel
    try {
      await supabase.channel('website_updates').send({
        type: 'broadcast',
        event: 'website_update_deleted',
        payload: deleteResult.data,
      })
    } catch (broadcastErr) {
      console.warn('Website updates broadcast failed:', broadcastErr)
    }

    return NextResponse.json({ announcement: deleteResult.data })
  } catch (err: any) {
    console.error('Website updates DELETE error:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete website update' }, { status: 500 })
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
      .from('website_updates')
      .update({ message: message.trim(), content: message.trim() })
      .eq('id', id)
      .select()
      .single()

    if (updateResult.error) {
      console.error('Website updates PUT error:', updateResult.error)
      return NextResponse.json({ error: updateResult.error.message || 'Failed to update website update' }, { status: 500 })
    }

    // Broadcast to real-time channel
    try {
      await supabase.channel('website_updates').send({
        type: 'broadcast',
        event: 'website_update_updated',
        payload: updateResult.data,
      })
    } catch (broadcastErr) {
      console.warn('Website updates broadcast failed:', broadcastErr)
    }

    return NextResponse.json({ announcement: updateResult.data })
  } catch (err: any) {
    console.error('Website updates PUT error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update website update' }, { status: 500 })
  }
}
