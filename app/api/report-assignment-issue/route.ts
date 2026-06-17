import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import nodemailer from 'nodemailer'

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
    const body = await request.json()
    const { assignmentId, assignmentFilename, issueDescription, workerId, workerName } = body

    if (!assignmentId || !issueDescription || !workerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(true)

    // Store the issue report in the database
    const { data: issueData, error: insertError } = await supabase
      .from('assignment_issues')
      .insert([{
        assignment_id: assignmentId,
        assignment_filename: assignmentFilename,
        issue_description: issueDescription,
        worker_id: workerId,
        worker_name: workerName || 'Unknown Worker',
        status: 'pending',
        created_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert issue report:', insertError)
      // If table doesn't exist, try to create it
      if (insertError.code === '42P01') {
        try {
          const { error: createError } = await supabase.rpc('exec_sql', {
            sql: `
              CREATE TABLE IF NOT EXISTS assignment_issues (
                id SERIAL PRIMARY KEY,
                assignment_id INTEGER NOT NULL,
                assignment_filename TEXT NOT NULL,
                issue_description TEXT NOT NULL,
                worker_id TEXT NOT NULL,
                worker_name TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                resolved_at TIMESTAMPTZ
              );
            `
          })
          if (createError) {
            console.error('Failed to create assignment_issues table:', createError)
            return NextResponse.json({ error: 'Failed to create issues table' }, { status: 500 })
          }
          // Retry the insert
          const { data: retryData, error: retryError } = await supabase
            .from('assignment_issues')
            .insert([{
              assignment_id: assignmentId,
              assignment_filename: assignmentFilename,
              issue_description: issueDescription,
              worker_id: workerId,
              worker_name: workerName || 'Unknown Worker',
              status: 'pending',
              created_at: new Date().toISOString(),
            }])
            .select()
            .single()
          if (retryError) {
            console.error('Failed to insert issue report after creating table:', retryError)
            return NextResponse.json({ error: 'Failed to report issue' }, { status: 500 })
          }
        } catch (err) {
          console.error('Failed to create table:', err)
          return NextResponse.json({ error: 'Failed to create issues table' }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: insertError.message || 'Failed to report issue' }, { status: 500 })
      }
    }

    // Send email notification to admins
    if (transporter) {
      try {
        // Fetch all admin emails
        const { data: admins } = await supabase
          .from('worker_profiles')
          .select('email, full_name')
          .eq('role', 'admin')

        if (admins && admins.length > 0) {
          const adminEmails = admins.map((admin: any) => 
            `"${admin.full_name || 'Admin'}" <${admin.email}>`
          ).join(', ')

          await transporter.sendMail({
            from: `"[ISSUE] ApexScript Solutions" <${process.env.EMAIL_USER}>`,
            to: adminEmails,
            subject: '[ALERT] Assignment Issue Reported',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Assignment Issue Reported</h2>
                <p style="color: #666; line-height: 1.6;">An issue has been reported for an assignment.</p>
                <p style="color: #666; line-height: 1.6;"><strong>Worker:</strong> ${workerName || 'Unknown Worker'}</p>
                <p style="color: #666; line-height: 1.6;"><strong>Assignment:</strong> ${assignmentFilename}</p>
                <p style="color: #666; line-height: 1.6;"><strong>Issue Description:</strong></p>
                <p style="color: #666; line-height: 1.6; background: #f5f5f5; padding: 10px; border-radius: 4px;">${issueDescription}</p>
                <p style="color: #666; line-height: 1.6;">Please check the dashboard to review and resolve this issue.</p>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; margin: 0;">This is an automated message. Please do not reply.</p>
              </div>
            `,
          })
        }
      } catch (emailError) {
        console.error('Failed to send admin notification email:', emailError)
        // Don't fail the request if email sending fails
      }
    }

    return NextResponse.json({ success: true, issue: issueData })
  } catch (err: any) {
    console.error('Report assignment issue error:', err)
    return NextResponse.json({ error: err.message || 'Failed to report issue' }, { status: 500 })
  }
}
