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

function buildWorkerPayslipEmailHtml(workerName: string, cutoffLabel: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 28px 32px; border-radius: 12px 12px 0 0;">
        <h2 style="margin: 0; color: #ffffff; font-size: 20px;">&#128196; Payslip Ready for Download</h2>
        <p style="margin: 6px 0 0; color: #d1fae5; font-size: 13px;">Your requested payslip is now available</p>
      </div>
      <div style="background: #ffffff; padding: 28px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 16px; font-size: 15px; color: #111827;">Hi <strong>${workerName}</strong>,</p>
        
        <p style="margin: 0 0 16px; font-size: 14px; color: #374151; line-height: 1.6;">
          Your requested payslip for the period <strong>${cutoffLabel}</strong> has been uploaded by the administrator.
        </p>

        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 8px; font-size: 14px; color: #065f46;">&#128229; How to download:</h4>
          <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #047857; line-height: 1.6;">
            <li>Log in to the <strong>ApexScript Worker Portal</strong>.</li>
            <li>In the Worker Hub, click on the <strong>"Request Payslip"</strong> action card.</li>
            <li>Inside the modal, switch to the <strong>"View Status"</strong> tab.</li>
            <li>Find your request for <strong>${cutoffLabel}</strong> and click the <strong>"Download payslip"</strong> button.</li>
          </ol>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0 20px;" />
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">This is an automated confirmation from the ApexScript Worker Portal. Do not reply to this email.</p>
      </div>
    </div>
  `
}

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const formData = await request.formData()
    const requestId = formData.get('requestId')
    const file = formData.get('file') as File | null

    if (!requestId || !file) {
      return NextResponse.json({ error: 'Missing requestId or file.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const contentType = file.type || 'application/pdf'

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data: existing, error: fetchErr } = await supabase
      .from('payslip_requests')
      .select('id,worker_id,status,cutoff_start')
      .eq('id', requestId)
      .single()

    if (fetchErr || !existing) {
      console.error('Payslip request upload fetch error:', fetchErr)
      return NextResponse.json({ error: 'Payslip request not found.' }, { status: 404 })
    }

    if (existing.status !== 'approved') {
      return NextResponse.json({ error: 'Only approved requests can be uploaded.' }, { status: 400 })
    }

    const storageBucket = process.env.SUPABASE_PAYSLIP_BUCKET
    if (!storageBucket) {
      return NextResponse.json({ error: 'Missing SUPABASE_PAYSLIP_BUCKET env variable. Set it to your Supabase storage bucket name.' }, { status: 500 })
    }

    const uploadPath = `${existing.worker_id}/payslip-${existing.id}-${Date.now()}.pdf`
    const { error: uploadError } = await supabase.storage.from(storageBucket).upload(uploadPath, buffer, { contentType })

    if (uploadError) {
      if (uploadError.message?.includes('Bucket not found')) {
        const { error: createBucketError } = await supabase.storage.createBucket(storageBucket, { public: true })
        if (createBucketError) {
          console.error('Payslip bucket creation error:', createBucketError)
          return NextResponse.json({ error: createBucketError.message || 'Failed to create storage bucket.' }, { status: 500 })
        }

        const { error: retryUploadError } = await supabase.storage.from(storageBucket).upload(uploadPath, buffer, { contentType })
        if (retryUploadError) {
          console.error('Payslip upload retry error:', retryUploadError)
          return NextResponse.json({ error: retryUploadError.message || 'Failed to upload payslip after bucket creation.' }, { status: 500 })
        }
      } else {
        console.error('Payslip upload error:', uploadError)
        return NextResponse.json({ error: uploadError.message || 'Failed to upload payslip.' }, { status: 500 })
      }
    }

    const { data: urlData } = await supabase.storage.from(storageBucket).getPublicUrl(uploadPath)
    if (!urlData?.publicUrl) {
      console.error('Payslip public URL error: no public URL returned')
      return NextResponse.json({ error: 'Failed to generate payslip URL.' }, { status: 500 })
    }

    const { error: updateError } = await supabase.from('payslip_requests').update({ payslip_url: urlData.publicUrl }).eq('id', requestId)
    if (updateError) {
      console.error('Payslip request URL update error:', updateError)
      return NextResponse.json({ success: true, payslipUrl: urlData.publicUrl, warning: updateError.message || 'Could not save payslip URL to the database. The file was uploaded successfully.' }, { status: 200 })
    }

    // Send email notification to worker
    if (transporter) {
      try {
        const { data: workerData } = await supabase
          .from('worker_profiles')
          .select('email, full_name')
          .eq('id', existing.worker_id)
          .single()

        if (workerData?.email) {
          const [y, m, day] = existing.cutoff_start.split('-').map(Number)
          const monthName = new Date(y, m - 1, 1).toLocaleString('default', { month: 'long' })
          const cutoffLabel = `${monthName} ${y} — ${day <= 14 ? 'First Cutoff' : 'Second Cutoff'}`
          const workerName = workerData.full_name || 'Worker'
          
          await transporter.sendMail({
            from: `"ApexScript Worker Portal" <${process.env.EMAIL_USER}>`,
            to: workerData.email,
            subject: `[PAYSLIP AVAILABLE] Your payslip for ${cutoffLabel} is ready`,
            html: buildWorkerPayslipEmailHtml(workerName, cutoffLabel),
          })
        }
      } catch (emailErr) {
        console.error('Failed to send email notification to worker:', emailErr)
      }
    }

    return NextResponse.json({ success: true, payslipUrl: urlData.publicUrl })
  } catch (error: any) {
    console.error('Payslip upload POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to upload payslip' }, { status: 500 })
  }
}
