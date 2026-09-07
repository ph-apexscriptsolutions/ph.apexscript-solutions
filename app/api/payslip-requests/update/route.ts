import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { buildPayslipApprovedEmailHtml, formatCutoffDetails } from '@/lib/payslip-emails'

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

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const body = await request.json()
    const requestId = body.requestId
    const status = body.status

    if (!requestId || !status) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data: existing, error: fetchErr } = await supabase
      .from('payslip_requests')
      .select('id, worker_id, status, cutoff_start, cutoff_end, requested_at')
      .eq('id', requestId)
      .single()

    if (fetchErr || !existing) {
      console.error('Payslip request fetch error:', fetchErr)
      return NextResponse.json({ error: fetchErr?.message || 'Failed to fetch payslip request' }, { status: 500 })
    }

    const previousStatus = existing.status
    const { error } = await supabase.from('payslip_requests').update({ status }).eq('id', requestId)

    if (error) {
      console.error('Payslip request update error:', error)
      return NextResponse.json({ error: error.message || 'Failed to update payslip request' }, { status: 500 })
    }

    // When admin approves the worker's payslip request, notify the worker via email
    if (status === 'approved' && previousStatus !== 'approved' && transporter) {
      try {
        const { data: workerData } = await supabase
          .from('worker_profiles')
          .select('email, full_name')
          .eq('id', existing.worker_id)
          .single()

        if (workerData?.email) {
          const { cutoffLabel, dateRange } = formatCutoffDetails(existing.cutoff_start, existing.cutoff_end)
          const workerName = workerData.full_name || 'Worker'

          await transporter.sendMail({
            from: `"ApexScript Worker Portal" <${process.env.EMAIL_USER}>`,
            to: workerData.email,
            subject: `[REQUEST APPROVED] Your payslip request for ${cutoffLabel} has been approved`,
            html: buildPayslipApprovedEmailHtml({
              workerName,
              cutoffLabel,
              dateRange,
            }),
          })
          console.log(`Payslip approval email successfully sent to ${workerData.email} for request #${requestId}`)
        } else {
          console.warn(`No email found for worker ID ${existing.worker_id}, skipping approval email notification`)
        }
      } catch (emailErr) {
        // Log error but do not fail the request
        console.error('Failed to send payslip approval email to worker:', emailErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Payslip request update POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update payslip request' }, { status: 500 })
  }
}
