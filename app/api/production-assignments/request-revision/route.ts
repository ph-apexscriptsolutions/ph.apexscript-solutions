import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const body = await request.json()
    const { assignmentId, reason, note } = body

    if (!assignmentId || !reason) {
      return NextResponse.json({ error: 'Missing assignmentId or reason' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Fetch the assignment to get worker info
    const { data: assignment, error: fetchError } = await supabase
      .from('production_assignments')
      .select('*')
      .eq('id', assignmentId)
      .single()

    if (fetchError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found.' }, { status: 404 })
    }

    // Update assignment status to needs_revision with reason and note
    const { data: updated, error: updateError } = await supabase
      .from('production_assignments')
      .update({
        status: 'needs_revision',
        revision_reason: reason,
        revision_note: note || null,
        revision_requested_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .select()
      .single()

    if (updateError) {
      console.error('Revision request update error:', updateError)
      return NextResponse.json({ error: updateError.message || 'Failed to request revision' }, { status: 500 })
    }

    // Also delete the existing production_record for this file so worker can resubmit
    // (Match by worker_id and filename)
    try {
      await supabase
        .from('production_records')
        .delete()
        .eq('worker_id', assignment.worker_id)
        .ilike('file_name', `${assignment.filename}%`)
    } catch (deleteErr) {
      console.warn('Could not delete old production record (may not exist):', deleteErr)
    }

    // Send email notification to the worker
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        // Fetch worker email
        const { data: worker } = await supabase
          .from('worker_profiles')
          .select('email, full_name')
          .eq('id', assignment.worker_id)
          .single()

        if (worker?.email) {
          const reasonLabels: Record<string, string> = {
            incomplete_transcript: 'Incomplete Transcript',
            incorrect_format: 'Incorrect Format',
            transcript_inconsistencies: 'Transcript Inconsistencies',
            other: 'Other',
          }

          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          })

          await transporter.sendMail({
            from: `"[ADMIN] ApexScript Transcription Services" <${process.env.EMAIL_USER}>`,
            to: worker.email,
            subject: `Revision Requested: ${assignment.filename}`,
            html: `
              <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 16px 16px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 20px;">⚠️ Revision Requested</h1>
                </div>
                <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
                  <p style="color: #374151; line-height: 1.6;">Hi <strong>${worker.full_name}</strong>,</p>
                  <p style="color: #374151; line-height: 1.6;">The admin has requested a revision on your submitted file:</p>
                  <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 16px; margin: 16px 0;">
                    <p style="margin: 0 0 8px 0; font-weight: bold; color: #92400e;">📄 File: ${assignment.filename}</p>
                    <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Reason:</strong> ${reasonLabels[reason] || reason}</p>
                    ${note ? `<p style="margin: 0; color: #92400e;"><strong>Note:</strong> ${note}</p>` : ''}
                  </div>
                  <p style="color: #374151; line-height: 1.6;">Please review and resubmit the corrected file through your dashboard.</p>
                  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                  <p style="color: #999; font-size: 12px; margin: 0;">This is an automated message. Please do not reply.</p>
                </div>
              </div>
            `,
          })
        }
      } catch (emailError) {
        console.error('Failed to send revision request email:', emailError)
        // Don't fail the request if email sending fails
      }
    }

    return NextResponse.json({ success: true, assignment: updated })
  } catch (error: any) {
    console.error('Request revision exception:', error)
    return NextResponse.json({ error: error.message || 'Failed to request revision' }, { status: 500 })
  }
}
