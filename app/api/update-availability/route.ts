import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getSupabaseServerClient } from '@/utils/supabase/server'

const transporter = process.env.EMAIL_USER && process.env.EMAIL_PASS
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null

type DayAvailability = { sameday: boolean; overnight: boolean }
type WeeklyAvailability = Record<string, DayAvailability>

function formatAvailabilityHtml(availability: WeeklyAvailability): string {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  const rows = days.map(day => {
    const { sameday, overnight } = availability[day] ?? { sameday: false, overnight: false }
    const types: string[] = []
    if (sameday) types.push('Sameday')
    if (overnight) types.push('Overnight')
    const label = types.length > 0 ? types.join(' & ') : 'Not Available'
    const color = types.length > 0 ? '#16a34a' : '#9ca3af'
    return `
      <tr>
        <td style="padding: 8px 16px; font-weight: 600; color: #374151; text-transform: capitalize; border-bottom: 1px solid #f3f4f6;">${day}</td>
        <td style="padding: 8px 16px; color: ${color}; font-weight: 600; border-bottom: 1px solid #f3f4f6;">${label}</td>
      </tr>`
  }).join('')

  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 8px; background: #f9fafb; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 10px 16px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Day</th>
          <th style="padding: 10px 16px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Availability</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { workerId, workerName, availability } = body as {
      workerId: string
      workerName: string
      availability: WeeklyAvailability
    }

    if (!workerId || !workerName || !availability) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    const { error } = await supabase
      .from('worker_profiles')
      .update({
        weekly_availability: availability,
        availability_submitted_at: new Date().toISOString(),
      })
      .eq('id', workerId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (transporter) {
      const now = new Date().toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        dateStyle: 'full',
        timeStyle: 'short',
      })

      await transporter.sendMail({
        from: `"ApexScript — Availability Update" <${process.env.EMAIL_USER}>`,
        to: 'ph.apexscriptsolutions@gmail.com',
        subject: `[AVAILABILITY UPDATE] ${workerName} has submitted their weekly schedule`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
            <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 28px 32px; border-radius: 12px 12px 0 0;">
              <h2 style="margin: 0; color: #ffffff; font-size: 20px;">&#128197; Weekly Availability Update</h2>
              <p style="margin: 6px 0 0; color: #d1fae5; font-size: 13px;">Submitted on ${now}</p>
            </div>
            <div style="background: #ffffff; padding: 28px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Worker</p>
              <p style="margin: 0 0 20px; font-size: 18px; font-weight: 700; color: #111827;">${workerName}</p>
              <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Schedule for the Upcoming Week</p>
              ${formatAvailabilityHtml(availability)}
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">This is an automated notification from the ApexScript Worker Portal. Do not reply to this email.</p>
            </div>
          </div>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Update availability error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update availability' }, { status: 500 })
  }
}
