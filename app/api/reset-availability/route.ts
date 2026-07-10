import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getSupabaseServerClient } from '@/utils/supabase/server'

const transporter = process.env.EMAIL_USER && process.env.EMAIL_PASS
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
  : null

function buildReminderEmailHtml(workerName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
      <div style="background: linear-gradient(135deg, #d97706, #b45309); padding: 28px 32px; border-radius: 12px 12px 0 0;">
        <h2 style="margin: 0; color: #ffffff; font-size: 20px;">&#128197; Weekly Availability Reset</h2>
        <p style="margin: 6px 0 0; color: #fef3c7; font-size: 13px;">Action required — please update your schedule</p>
      </div>
      <div style="background: #ffffff; padding: 28px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 16px; font-size: 15px; color: #111827;">Hi <strong>${workerName}</strong>,</p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #374151; line-height: 1.6;">
          Your weekly availability has been <strong>automatically reset</strong> for the new week.
          To remain eligible for work assignments, please log in to the <strong>ApexScript Worker Portal</strong>
          and submit your updated availability as soon as possible.
        </p>
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">
            &#9888; Please submit your availability promptly to ensure accurate workforce planning and assignment scheduling.
          </p>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">This is an automated weekly reminder from the ApexScript Worker Portal. Do not reply to this email.</p>
      </div>
    </div>
  `
}

export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron or is authorized
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseServerClient()

    // Fetch all active worker profiles with email
    const { data: workers, error: fetchError } = await supabase
      .from('worker_profiles')
      .select('id, full_name, email')
      .not('email', 'is', null)

    if (fetchError) {
      console.error('Reset availability fetch error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!workers || workers.length === 0) {
      return NextResponse.json({ success: true, message: 'No workers found', reset: 0 })
    }

    // Reset weekly_availability and availability_submitted_at for all workers
    const { error: resetError } = await supabase
      .from('worker_profiles')
      .update({
        weekly_availability: null,
        availability_submitted_at: null,
      })
      .not('id', 'is', null)

    if (resetError) {
      console.error('Reset availability update error:', resetError)
      return NextResponse.json({ error: resetError.message }, { status: 500 })
    }

    // Send reminder emails to all workers
    if (transporter) {
      const emailPromises = workers
        .filter(w => w.email)
        .map(w => {
          const isProduction = process.env.NODE_ENV === 'production'
          const isSafeEmail = w.email.toLowerCase().includes('cabello') || w.email.toLowerCase().includes('apexscriptsolutions')
          if (!isProduction && !isSafeEmail) {
            console.log(`[SIMULATED] Email would be sent to: ${w.email} (${w.full_name})`)
            return Promise.resolve()
          }
          return transporter!.sendMail({
            from: `"ApexScript Worker Portal" <${process.env.EMAIL_USER}>`,
            to: w.email,
            subject: `[ACTION REQUIRED] Please submit your weekly availability`,
            html: buildReminderEmailHtml(w.full_name || 'Worker'),
          }).catch(err => {
            // Don't fail entire batch if one email fails
            console.error(`Failed to send reminder to ${w.email}:`, err)
          })
        })

      await Promise.all(emailPromises)
    }

    return NextResponse.json({
      success: true,
      message: `Availability reset and reminders sent to ${workers.length} workers`,
      reset: workers.length,
    })
  } catch (err: any) {
    console.error('Reset availability cron error:', err)
    return NextResponse.json({ error: err.message || 'Failed to reset availability' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { workerId } = await request.json()
    if (!workerId) {
      return NextResponse.json({ error: 'Missing worker ID.' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Reset weekly_availability and availability_submitted_at for this specific worker
    const { error } = await supabase
      .from('worker_profiles')
      .update({
        weekly_availability: null,
        availability_submitted_at: null,
      })
      .eq('id', workerId)

    if (error) {
      console.error('Reset single worker availability error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Reset single worker availability unexpected error:', err)
    return NextResponse.json({ error: err.message || 'Failed to reset availability' }, { status: 500 })
  }
}

