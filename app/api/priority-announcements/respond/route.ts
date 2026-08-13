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

export async function POST(request: Request) {
  try {
    const { announcementId, workerId, workerName, workerEmail, response, note = '' } = await request.json()

    if (!announcementId || !workerId || !response) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['accepted', 'declined'].includes(response)) {
      return NextResponse.json({ error: 'Invalid response value' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(true)

    // Fetch parent announcement to check status & target settings
    const { data: announcement, error: fetchErr } = await supabase
      .from('priority_announcements')
      .select('*')
      .eq('id', announcementId)
      .single()

    if (fetchErr || !announcement) {
      return NextResponse.json({ error: 'Priority announcement not found or inactive' }, { status: 404 })
    }

    // Check if announcement is already claimed (if first_come_first_served)
    if (announcement.first_come_first_served && announcement.status === 'claimed' && announcement.claimed_by_worker_id !== workerId) {
      return NextResponse.json({
        error: `This assignment has already been claimed by ${announcement.claimed_by_worker_name || 'another worker'}.`,
        alreadyClaimed: true,
        claimedByName: announcement.claimed_by_worker_name,
      }, { status: 409 })
    }

    // Insert or update worker's response
    const responsePayload = {
      announcement_id: announcementId,
      worker_id: workerId,
      worker_name: workerName || 'Worker',
      worker_email: workerEmail || '',
      response: response,
      note: note.trim(),
      responded_at: new Date().toISOString(),
    }

    const { data: insertedResp, error: insertErr } = await supabase
      .from('priority_announcement_responses')
      .insert([responsePayload])
      .select()
      .single()

    if (insertErr) {
      console.error('Response insert error:', insertErr)
      return NextResponse.json({ error: insertErr.message || 'Failed to record response' }, { status: 500 })
    }

    // If worker accepted & announcement is first_come_first_served, update status to claimed
    let updatedAnnouncement = announcement
    if (response === 'accepted' && announcement.first_come_first_served) {
      const { data: updated } = await supabase
        .from('priority_announcements')
        .update({
          status: 'claimed',
          claimed_by_worker_id: workerId,
          claimed_by_worker_name: workerName || 'Worker',
        })
        .eq('id', announcementId)
        .select()
        .single()

      if (updated) {
        updatedAnnouncement = updated
      }
    }

    // Broadcast Realtime event to Admin dashboard
    try {
      await supabase.channel('priority_announcements').send({
        type: 'broadcast',
        event: 'priority_response_received',
        payload: {
          announcementId,
          response: insertedResp,
          announcement: updatedAnnouncement,
        },
      })
    } catch (rtErr) {
      console.warn('Realtime response broadcast warning:', rtErr)
    }

    // Send Email to Admin — always send ONLY to the configured admin email (EMAIL_USER)
    if (transporter && process.env.EMAIL_USER) {
      try {
        const adminRecipient = process.env.EMAIL_USER
        const actionText = response === 'accepted' ? '✅ ACCEPTED' : '❌ DECLINED'
        const badgeColor = response === 'accepted' ? '#16a34a' : '#dc2626'

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #1e293b;">Rush Assignment Response Received</h2>
            <p>Worker <strong>${workerName || workerId}</strong> (${workerEmail || 'No email'}) has responded to your priority announcement:</p>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <h3 style="margin-top: 0; color: #0f172a;">${announcement.title}</h3>
              <p><strong>Response:</strong> <span style="color: white; background: ${badgeColor}; padding: 4px 10px; border-radius: 4px; font-weight: bold; display: inline-block;">${actionText}</span></p>
              ${note ? `<p><strong>Worker Note:</strong> ${note}</p>` : ''}
              <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">Time: ${new Date().toLocaleString()}</p>
            </div>

            <p>You can view full real-time worker responses on your Admin Dashboard.</p>
          </div>
        `

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: adminRecipient,
          bcc: 'ph.apexscriptsolutions@gmail.com',
          subject: `[${actionText}] ${workerName || 'Worker'} - ${announcement.title}`,
          html: htmlContent,
        }).catch(e => console.error('Admin email send mail error:', e))
      } catch (emailErr) {
        console.error('Email error sending response notification to admin:', emailErr)
      }
    }

    return NextResponse.json({
      success: true,
      response: insertedResp,
      announcement: updatedAnnouncement,
    })
  } catch (err: any) {
    console.error('Respond priority announcement error:', err)
    return NextResponse.json({ error: err.message || 'Failed to submit response' }, { status: 500 })
  }
}
