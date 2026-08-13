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

    // Send email notification to ph.apexscriptsolutions@gmail.com
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"[ISSUE] ApexScript Transcription Services" <${process.env.EMAIL_USER}>`,
          to: process.env.EMAIL_USER,
          bcc: 'ph.apexscriptsolutions@gmail.com',
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status, solution, resolved_by } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(true)

    const updateData: any = { status }
    
    if (solution !== undefined) {
      updateData.solution = solution
    }
    
    if (resolved_by !== undefined) {
      updateData.resolved_by = resolved_by
    }
    
    if (status === 'resolved' && !updateData.resolved_at) {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('assignment_issues')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Failed to update assignment issue:', error)
      return NextResponse.json({ error: error.message || 'Failed to update issue' }, { status: 500 })
    }

    // Send email notification to worker when issue is resolved
    if (status === 'resolved' && data && data[0] && transporter) {
      try {
        const issue = data[0]
        
        // Fetch worker's email
        const { data: workerData, error: workerError } = await supabase
          .from('worker_profiles')
          .select('email, full_name')
          .eq('id', issue.worker_id)
          .single()

        if (!workerError && workerData?.email) {
          await transporter.sendMail({
            from: `"[RESOLVED] ApexScript Transcription Services" <${process.env.EMAIL_USER}>`,
            to: `"${workerData.full_name || 'Worker'}" <${workerData.email}>`,
            subject: '[RESOLVED] Your Assignment Issue Has Been Resolved',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Your Assignment Issue Has Been Resolved</h2>
                <p style="color: #666; line-height: 1.6;">Hello ${workerData.full_name || 'Worker'},</p>
                <p style="color: #666; line-height: 1.6;">The issue you reported for your assignment has been resolved by our team.</p>
                <p style="color: #666; line-height: 1.6;"><strong>Assignment:</strong> ${issue.assignment_filename}</p>
                <p style="color: #666; line-height: 1.6;"><strong>Issue:</strong> ${issue.issue_description}</p>
                ${resolved_by ? `<p style="color: #666; line-height: 1.6;"><strong>Resolved by:</strong> ${resolved_by}</p>` : ''}
                <p style="color: #666; line-height: 1.6;">Please check your <strong>Issue History</strong> in the dashboard to view the solution.</p>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; margin: 0;">This is an automated message. Please do not reply.</p>
              </div>
            `,
          })
        }
      } catch (emailError) {
        console.error('Failed to send resolution email:', emailError)
        // Don't fail the request if email sending fails
      }
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (err: any) {
    console.error('Update assignment issue error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update issue' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const workerId = searchParams.get('worker_id')

    const supabase = getSupabaseServerClient(true)

    let query = supabase
      .from('assignment_issues')
      .select('*')
      .order('created_at', { ascending: false })

    if (workerId) {
      query = query.eq('worker_id', workerId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to fetch assignment issues:', error)
      return NextResponse.json({ error: error.message || 'Failed to fetch issues' }, { status: 500 })
    }

    return NextResponse.json({ issues: data }, { status: 200 })
  } catch (err: any) {
    console.error('Fetch assignment issues error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch issues' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient(true)

    const { error } = await supabase
      .from('assignment_issues')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete assignment issue:', error)
      return NextResponse.json({ error: error.message || 'Failed to delete issue' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    console.error('Delete assignment issue error:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete issue' }, { status: 500 })
  }
}
