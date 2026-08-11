import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import nodemailer from 'nodemailer'

const transporter = process.env.EMAIL_USER && process.env.EMAIL_PASS
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null

async function ensureTablesExist(supabase: any) {
  try {
    // Check if priority_announcements exists by doing a light query
    const { error } = await supabase.from('priority_announcements').select('id').limit(1)
    if (error && (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation'))) {
      console.log('Creating priority_announcements tables...')
      // Attempt SQL execution via RPC or fallback table creation
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.priority_announcements (
            id serial PRIMARY KEY,
            admin_id text,
            admin_name text DEFAULT 'Admin',
            title text NOT NULL,
            description text NOT NULL DEFAULT '',
            target_type text NOT NULL DEFAULT 'all',
            target_worker_ids jsonb DEFAULT '[]'::jsonb,
            first_come_first_served boolean NOT NULL DEFAULT false,
            status text NOT NULL DEFAULT 'active',
            claimed_by_worker_id text,
            claimed_by_worker_name text,
            expires_at timestamptz,
            created_at timestamptz NOT NULL DEFAULT now()
          );

          CREATE TABLE IF NOT EXISTS public.priority_announcement_responses (
            id serial PRIMARY KEY,
            announcement_id integer REFERENCES public.priority_announcements(id) ON DELETE CASCADE,
            worker_id text NOT NULL,
            worker_name text NOT NULL DEFAULT '',
            worker_email text DEFAULT '',
            response text NOT NULL,
            note text DEFAULT '',
            responded_at timestamptz NOT NULL DEFAULT now()
          );
        `
      }).catch((e: any) => console.warn('RPC exec_sql fallback error:', e?.message))
    }
  } catch (err) {
    console.warn('ensureTablesExist catch error:', err)
  }
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServerClient(true)

    const { searchParams } = new URL(request.url)
    const workerId = searchParams.get('workerId')
    const role = searchParams.get('role')

    let query = supabase
      .from('priority_announcements')
      .select('*, responses:priority_announcement_responses(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.warn('Priority Announcements query warning (table may need creation in Supabase SQL Editor):', error.message)
      const schemaHint = `CREATE TABLE IF NOT EXISTS public.priority_announcements (
  id serial PRIMARY KEY,
  admin_id text,
  admin_name text DEFAULT 'Admin',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  target_type text NOT NULL DEFAULT 'all',
  target_worker_ids jsonb DEFAULT '[]'::jsonb,
  first_come_first_served boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  claimed_by_worker_id text,
  claimed_by_worker_name text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.priority_announcement_responses (
  id serial PRIMARY KEY,
  announcement_id integer REFERENCES public.priority_announcements(id) ON DELETE CASCADE,
  worker_id text NOT NULL,
  worker_name text NOT NULL DEFAULT '',
  worker_email text DEFAULT '',
  response text NOT NULL,
  note text DEFAULT '',
  responded_at timestamptz NOT NULL DEFAULT now()
);`
      return NextResponse.json({ announcements: [], schemaHint })
    }

    let filtered = data || []

    // If request comes from a worker, filter for active non-expired announcements that target this worker
    if (role !== 'admin' && workerId) {
      const now = new Date().getTime()
      filtered = filtered.filter((item: any) => {
        // Expiration check
        if (item.expires_at && new Date(item.expires_at).getTime() < now) {
          return false
        }
        // Target check
        if (item.target_type === 'all') return true
        if (item.target_type === 'specific' && Array.isArray(item.target_worker_ids)) {
          return item.target_worker_ids.includes(workerId)
        }
        return true
      })
    }

    return NextResponse.json({ announcements: filtered })
  } catch (err: any) {
    console.error('Priority Announcements GET error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch priority announcements' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      adminId,
      adminName = 'Admin',
      title,
      description = '',
      targetType = 'all', // 'all' | 'specific'
      targetWorkerIds = [],
      firstComeFirstServed = false,
      expirationMinutes = null, // e.g. 15, 30, 60, null
      sendEmailAlert = false,
    } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Announcement title is required' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(true)
    await ensureTablesExist(supabase)

    let expiresAt: string | null = null
    if (expirationMinutes && typeof expirationMinutes === 'number' && expirationMinutes > 0) {
      const expDate = new Date(Date.now() + expirationMinutes * 60 * 1000)
      expiresAt = expDate.toISOString()
    }

    const newAnnouncement = {
      admin_id: adminId,
      admin_name: adminName,
      title: title.trim(),
      description: description.trim(),
      target_type: targetType,
      target_worker_ids: targetWorkerIds,
      first_come_first_served: firstComeFirstServed,
      status: 'active',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('priority_announcements')
      .insert([newAnnouncement])
      .select()
      .single()

    if (error) {
      console.error('Priority Announcement POST error:', error)
      const msg = error.message || ''
      if (error.code === '42P01' || msg.includes('does not exist') || msg.includes('relation') || msg.includes('schema cache')) {
        return NextResponse.json({
          error: "Table 'priority_announcements' does not exist in your Supabase database yet. Please execute the migration SQL in your Supabase SQL Editor to create it.",
          needsMigration: true,
        }, { status: 500 })
      }
      return NextResponse.json({ error: error.message || 'Failed to publish priority announcement' }, { status: 500 })
    }

    // Real-time broadcast via Supabase Realtime Channel
    try {
      await supabase.channel('priority_announcements').send({
        type: 'broadcast',
        event: 'new_priority_announcement',
        payload: data,
      })
    } catch (realtimeErr) {
      console.warn('Realtime broadcast error:', realtimeErr)
    }

    // Send optional email alert to targeted workers only
    // NOTE: Admin (EMAIL_USER) is excluded from worker broadcasts - they receive response notifications separately
    if (sendEmailAlert && transporter) {
      try {
        const adminEmail = (process.env.EMAIL_USER || '').toLowerCase().trim()
        let recipientEmails: string[] = []

        if (targetType === 'all') {
          // Send to all workers but explicitly exclude the admin/system email
          const { data: workers } = await supabase
            .from('worker_profiles')
            .select('email, role')
            .not('email', 'is', null)
          recipientEmails = (workers || [])
            .map((w: any) => w.email?.toLowerCase().trim())
            .filter((email: string) => Boolean(email) && email !== adminEmail)
        } else if (Array.isArray(targetWorkerIds) && targetWorkerIds.length > 0) {
          // Send only to specifically selected workers
          const { data: workers } = await supabase
            .from('worker_profiles')
            .select('email')
            .in('id', targetWorkerIds)
            .not('email', 'is', null)
          recipientEmails = (workers || [])
            .map((w: any) => w.email?.toLowerCase().trim())
            .filter((email: string) => Boolean(email) && email !== adminEmail)
        }

        if (recipientEmails.length > 0) {
          const emailSubject = `🚨 RUSH ASSIGNMENT: ${data.title}`
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #dc2626;">🚨 Priority / Rush Assignment Broadcast</h2>
              <p>Hello Team,</p>
              <p>An urgent task has just been announced on your dashboard by <strong>${data.admin_name || 'Admin'}</strong>:</p>
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0;">
                <h3 style="margin-top: 0; color: #991b1b;">${data.title}</h3>
                <p style="white-space: pre-wrap;">${data.description || 'No additional details provided.'}</p>
                ${data.expires_at ? `<p><strong>Expires:</strong> ${new Date(data.expires_at).toLocaleString()}</p>` : ''}
              </div>
              <p>Please log in to your dashboard to <strong>Accept</strong> or <strong>Decline</strong> this assignment.</p>
            </div>
          `
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: recipientEmails.join(', '),
            subject: emailSubject,
            html: emailHtml,
          }).catch((e) => console.error('Sending target announcement emails error:', e))
        }
      } catch (emailErr) {
        console.error('Email alert processing error:', emailErr)
      }
    }

    return NextResponse.json({ announcement: data })
  } catch (err: any) {
    console.error('Priority Announcement POST exception:', err)
    return NextResponse.json({ error: err.message || 'Failed to create priority announcement' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing announcement id' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(true)
    const { error } = await supabase
      .from('priority_announcements')
      .update({ status: 'closed' })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Broadcast closure event
    try {
      await supabase.channel('priority_announcements').send({
        type: 'broadcast',
        event: 'closed_priority_announcement',
        payload: { id: parseInt(id, 10) },
      })
    } catch (e) {
      console.warn('Realtime send error on DELETE:', e)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
