import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import nodemailer from 'nodemailer'

const getAnnouncementSchemaHint = (error: any) => {
  const message = typeof error?.message === 'string' ? error.message : String(error || '')
  if (/could not find.*message.*column/i.test(message) || /message.*column.*could not find/i.test(message) || /column "message" does not exist/i.test(message)) {
    return `DO $$\nBEGIN\n  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'announcements') THEN\n    CREATE TABLE public.announcements (\n      id serial PRIMARY KEY,\n      message text NOT NULL DEFAULT '',\n      active boolean NOT NULL DEFAULT true,\n      created_at timestamptz NOT NULL DEFAULT now()\n    );\n  ELSE\n    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'message') THEN\n      ALTER TABLE public.announcements ADD COLUMN message text NOT NULL DEFAULT '';\n    END IF;\n    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'active') THEN\n      ALTER TABLE public.announcements ADD COLUMN active boolean NOT NULL DEFAULT true;\n    END IF;\n    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'announcements' AND column_name = 'created_at') THEN\n      ALTER TABLE public.announcements ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();\n    END IF;\n  END IF;\nEND$$;`
  }

  if (/could not find.*active.*column/i.test(message) || /active.*column.*could not find/i.test(message) || /column "active" does not exist/i.test(message)) {
    return `ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;`
  }

  if (/could not find.*created_at.*column/i.test(message) || /created_at.*column.*could not find/i.test(message) || /column "created_at" does not exist/i.test(message)) {
    return `ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();`
  }

  if (/could not find.*title.*column/i.test(message) || /title.*column.*could not find/i.test(message) || /column "title" does not exist/i.test(message) || /null value in column "title".*violates not-null constraint/i.test(message)) {
    return `ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS public.announcements
  ALTER COLUMN title DROP NOT NULL;`
  }

  if (/could not find.*content.*column/i.test(message) || /content.*column.*could not find/i.test(message) || /column "content" does not exist/i.test(message) || /null value in column "content".*violates not-null constraint/i.test(message)) {
    return `ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '';
ALTER TABLE IF EXISTS public.announcements
  ALTER COLUMN content DROP NOT NULL;`
  }

  if (/null value in column "admin_id".*violates not-null constraint/i.test(message) || /column "admin_id" does not exist/i.test(message)) {
    return `ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS admin_id text;
ALTER TABLE public.announcements
  ALTER COLUMN admin_id DROP NOT NULL;`
  }

  return null
}

const isActiveColumnError = (error: any) => {
  const message = typeof error?.message === 'string' ? error.message : String(error || '')
  return /could not find.*active.*column|active.*column.*could not find|column "active" does not exist/i.test(message)
}

const isAnnouncementSchemaError = (error: any) => {
  const message = typeof error?.message === 'string' ? error.message : String(error || '')
  return /could not find.*column|column ".*" does not exist|schema cache/i.test(message)
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient(true)

    let result = await supabase
      .from('announcements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)

    if (result.error && isActiveColumnError(result.error)) {
      result = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
    }

    if (result.error) {
      const schemaHint = getAnnouncementSchemaHint(result.error)
      console.error('Announcements GET error:', result.error)
      return NextResponse.json({ error: result.error.message || 'Failed to fetch announcements', schemaHint }, { status: 500 })
    }

    return NextResponse.json({ announcements: result.data || [] })
  } catch (err: any) {
    console.error('Announcements GET error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch announcements' }, { status: 500 })
  }
}

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

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing announcement message' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(true)
    const deactivate = await supabase
      .from('announcements')
      .update({ active: false })
      .eq('active', true)

    const hasActiveColumn = !deactivate.error || !isAnnouncementSchemaError(deactivate.error)
    if (deactivate.error && !hasActiveColumn) {
      console.warn('Announcements active column missing: disabling active updates for announcements')
    } else if (deactivate.error) {
      console.error('Announcements deactivate error:', deactivate.error)
    }

    const insertPayload: any = { message: message.trim(), content: message.trim() }
    if (hasActiveColumn) {
      insertPayload.active = true
    }

    let insertResult = await supabase
      .from('announcements')
      .insert([insertPayload])
      .select()
      .single()

    if (insertResult.error && isAnnouncementSchemaError(insertResult.error)) {
      const msg = insertResult.error.message || ''
      const missingMessage = /could not find.*message.*column|message.*column.*could not find|column "message" does not exist/i.test(msg)
      const missingContent = /could not find.*content.*column|content.*column.*could not find|column "content" does not exist/i.test(msg)

      if (hasActiveColumn && /could not find.*active.*column|active.*column.*could not find|column "active" does not exist/i.test(msg)) {
        console.warn('Announcements POST retry without active column due to schema mismatch')
        delete insertPayload.active
        insertResult = await supabase
          .from('announcements')
          .insert([insertPayload])
          .select()
          .single()
      } else if (missingMessage && !missingContent) {
        insertResult = await supabase
          .from('announcements')
          .insert([{ content: message.trim(), ...(hasActiveColumn ? { active: true } : {}) }])
          .select()
          .single()
      } else if (missingContent && !missingMessage) {
        insertResult = await supabase
          .from('announcements')
          .insert([{ message: message.trim(), ...(hasActiveColumn ? { active: true } : {}) }])
          .select()
          .single()
      }
    }

    const schemaHint = getAnnouncementSchemaHint(insertResult.error)

    if (insertResult.error) {
      console.error('Announcements POST error:', insertResult.error)
      return NextResponse.json({ error: insertResult.error.message || 'Failed to create announcement', schemaHint }, { status: 500 })
    }

    const data = insertResult.data

    try {
      await supabase.channel('announcements').send({
        type: 'broadcast',
        event: 'new_announcement',
        payload: data,
      })
    } catch (broadcastErr) {
      console.warn('Announcements broadcast failed:', broadcastErr)
    }

    // Send email notifications to all workers
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
              subject: '[ANNOUNCEMENT] New Announcement from Admin',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">New Announcement</h2>
                  <p style="color: #666; line-height: 1.6;">Please check your dashboard for the latest announcement.</p>
                  <p style="color: #999; font-size: 12px; margin-top: 20px;">
                    This is an automated message from ApexScript Transcription Services.
                  </p>
                </div>
              `,
            })
            console.log('Announcement emails sent successfully. Result:', result)
          }
        } else if (workersError) {
          console.error('Failed to fetch workers for announcement emails:', workersError)
        }
      } catch (emailError) {
        console.error('Failed to send announcement notification emails. Error details:', emailError)
      }
    }

    return NextResponse.json({
      announcement: data,
      schemaHint,
    })
  } catch (err: any) {
    console.error('Announcements POST error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create announcement' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Missing announcement id' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(true)
    let deleteResult = await supabase
      .from('announcements')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single()

    const deleteActiveColumnMissing = deleteResult.error && isActiveColumnError(deleteResult.error)
    if (deleteActiveColumnMissing) {
      deleteResult = await supabase
        .from('announcements')
        .delete()
        .eq('id', id)
        .select()
        .single()
    }

    if (deleteResult.error) {
      const schemaHint = getAnnouncementSchemaHint(deleteResult.error)
      console.error('Announcements DELETE error:', deleteResult.error)
      return NextResponse.json({ error: deleteResult.error.message || 'Failed to delete announcement', schemaHint }, { status: 500 })
    }

    try {
      await supabase.channel('announcements').send({
        type: 'broadcast',
        event: 'new_announcement',
        payload: deleteResult.data,
      })
    } catch (broadcastErr) {
      console.warn('Announcements broadcast failed:', broadcastErr)
    }

    const deletionHint = deleteActiveColumnMissing
      ? 'ALTER TABLE announcements ADD COLUMN active boolean NOT NULL DEFAULT true;'
      : null

    return NextResponse.json({ announcement: deleteResult.data, schemaHint: deletionHint })
  } catch (err: any) {
    const schemaHint = getAnnouncementSchemaHint(err)
    console.error('Announcements DELETE error:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete announcement', schemaHint }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, message } = await request.json()
    if (!id || !message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing announcement id or message' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(true)
    let updatePayload: any = { message: message.trim(), content: message.trim() }
    let updateResult = await supabase
      .from('announcements')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateResult.error && isAnnouncementSchemaError(updateResult.error)) {
      const msg = updateResult.error.message || ''
      const missingMessage = /could not find.*message.*column|message.*column.*could not find|column "message" does not exist/i.test(msg)
      const missingContent = /could not find.*content.*column|content.*column.*could not find|column "content" does not exist/i.test(msg)

      if (missingMessage && !missingContent) {
        updateResult = await supabase
          .from('announcements')
          .update({ content: message.trim() })
          .eq('id', id)
          .select()
          .single()
      } else if (missingContent && !missingMessage) {
        updateResult = await supabase
          .from('announcements')
          .update({ message: message.trim() })
          .eq('id', id)
          .select()
          .single()
      }
    }

    const { data, error } = updateResult

    if (error) {
      const schemaHint = getAnnouncementSchemaHint(error)
      console.error('Announcements PUT error:', error)
      return NextResponse.json({ error: error.message || 'Failed to update announcement', schemaHint }, { status: 500 })
    }

    try {
      await supabase.channel('announcements').send({
        type: 'broadcast',
        event: 'new_announcement',
        payload: data,
      })
    } catch (broadcastErr) {
      console.warn('Announcements broadcast failed:', broadcastErr)
    }

    return NextResponse.json({ announcement: data, schemaHint: null })
  } catch (err: any) {
    console.error('Announcements PUT error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update announcement' }, { status: 500 })
  }
}
