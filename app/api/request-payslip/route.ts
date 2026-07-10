import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const transporter = process.env.EMAIL_USER && process.env.EMAIL_PASS
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null

function buildPayslipRequestEmailHtml(workerName: string, cutoffLabel: string, requestedAt: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
      <div style="background: linear-gradient(135deg, #7c3aed, #9333ea); padding: 28px 32px; border-radius: 12px 12px 0 0;">
        <h2 style="margin: 0; color: #ffffff; font-size: 20px;">&#128196; New Payslip Request</h2>
        <p style="margin: 6px 0 0; color: #e9d5ff; font-size: 13px;">Submitted on ${requestedAt}</p>
      </div>
      <div style="background: #ffffff; padding: 28px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Worker</p>
        <p style="margin: 0 0 20px; font-size: 18px; font-weight: 700; color: #111827;">${workerName}</p>

        <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Payslip Period</p>
        <p style="margin: 0 0 24px; font-size: 16px; font-weight: 700; color: #7c3aed;">${cutoffLabel}</p>

        <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; color: #6b3fa0;">&#128276; Please log in to the admin dashboard to review and process this payslip request.</p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 20px;" />
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">This is an automated notification from the ApexScript Worker Portal. Do not reply to this email.</p>
      </div>
    </div>
  `
}

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const body = await request.json()
    const workerId = body.workerId as string
    const cutoffStart = body.cutoffStart as string
    const cutoffEnd = body.cutoffEnd as string

    if (!workerId || !cutoffStart || !cutoffEnd) {
      return NextResponse.json({ error: 'Missing required fields for payslip request.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Fetch worker name for the email
    const { data: workerData } = await supabase
      .from('worker_profiles')
      .select('full_name')
      .eq('id', workerId)
      .single()

    const workerName: string = workerData?.full_name || 'Unknown Worker'

    // Insert payslip request
    const { data, error } = await supabase.from('payslip_requests').insert({
      worker_id: workerId,
      cutoff_start: cutoffStart,
      cutoff_end: cutoffEnd,
      status: 'pending',
      requested_at: new Date().toISOString(),
    }).select().single()

    if (error) {
      console.error('Payslip request insert error:', error)
      return NextResponse.json({ error: error.message || 'Failed to save payslip request' }, { status: 500 })
    }

    // Send admin email notification
    if (transporter) {
      const requestedAt = new Date().toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        dateStyle: 'full',
        timeStyle: 'short',
      })

      // Build friendly cutoff label from stored date string
      const [y, m, day] = cutoffStart.split('-').map(Number)
      const monthName = new Date(y, m - 1, 1).toLocaleString('default', { month: 'long' })
      const cutoffLabel = `${monthName} ${y} — ${day <= 14 ? 'First Cutoff' : 'Second Cutoff'}`

      try {
        await transporter.sendMail({
          from: `"ApexScript — Worker Portal" <${process.env.EMAIL_USER}>`,
          to: 'ph.apexscriptsolutions@gmail.com',
          subject: `[PAYSLIP REQUEST] ${workerName} has requested their payslip — ${cutoffLabel}`,
          html: buildPayslipRequestEmailHtml(workerName, cutoffLabel, requestedAt),
        })
      } catch (emailErr) {
        // Log but don't fail the request if email errors
        console.error('Payslip request email error:', emailErr)
      }
    }

    return NextResponse.json({ success: true, request: data })
  } catch (error: any) {
    console.error('Payslip request error:', error)
    return NextResponse.json({ error: error.message || 'Failed to request payslip' }, { status: 500 })
  }
}
