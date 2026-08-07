import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const body = await request.json()
    const { worker_id, worker_name, transcript_content, issue_description, department } = body

    if (!worker_id || !worker_name || !issue_description || !department) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data, error } = await supabase
      .from('validator_issue_reports')
      .insert({
        worker_id,
        worker_name,
        transcript_content: transcript_content || '',
        issue_description,
        department,
        status: 'pending'
      })
      .select()

    if (error) {
      console.error('Error inserting validator issue report:', error)
      return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error in validator issue reports API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const workerId = searchParams.get('worker_id')

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    let query = supabase
      .from('validator_issue_reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (workerId) {
      query = query.eq('worker_id', workerId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching validator issue reports:', error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    return NextResponse.json({ reports: data }, { status: 200 })
  } catch (error) {
    console.error('Error in validator issue reports API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const body = await request.json()
    const { id, status, solution, resolved_by } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const updateData: any = { status, updated_at: new Date().toISOString() }
    
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
      .from('validator_issue_reports')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating validator issue report:', error)
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
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
            subject: '[RESOLVED] Your Issue Has Been Resolved',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Your Issue Has Been Resolved</h2>
                <p style="color: #666; line-height: 1.6;">Hello ${workerData.full_name || 'Worker'},</p>
                <p style="color: #666; line-height: 1.6;">The issue you reported has been resolved by our team.</p>
                <p style="color: #666; line-height: 1.6;"><strong>Department:</strong> ${issue.department}</p>
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
  } catch (error) {
    console.error('Error in validator issue reports API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { error } = await supabase
      .from('validator_issue_reports')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting validator issue report:', error)
      return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error in validator issue reports API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
