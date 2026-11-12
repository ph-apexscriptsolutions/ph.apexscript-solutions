import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'
import nodemailer from 'nodemailer'
import { parseAndFormatAssignment, isRawAssignmentSequence, extractAssignmentFields, ensureAssignmentTypeInDescription } from '@/utils/assignment-formatter'

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

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServerClient(true)

    const url = new URL(request.url)
    const workerId = url.searchParams.get('workerId')

    if (!workerId) {
      return NextResponse.json({ error: 'Missing workerId' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('production_assignments')
      .select('*')
      .eq('worker_id', workerId)
      .eq('admin_deleted', false)
      .order('is_priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Assignments fetch error:', error)
      return NextResponse.json({ error: error.message || 'Failed to fetch assignments' }, { status: 500 })
    }

    return NextResponse.json({ assignments: data || [] })
  } catch (err: any) {
    console.error('Assignments GET error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch assignments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { workerId, filename, dueTime, description, attachmentUrl, isPriority, assignmentType } = body

    if (!workerId || !filename) {
      return NextResponse.json({ error: 'Missing workerId or filename' }, { status: 400 })
    }

    // Resolve assignment type: explicitly passed, extracted from description, or default 'Sameday Assignment'
    let resolvedAssignmentType: 'Sameday Assignment' | 'Overnight Assignment' =
      assignmentType === 'Overnight Assignment' || assignmentType === 'Sameday Assignment'
        ? assignmentType
        : /overnight\s*assignment/i.test(description || '')
          ? 'Overnight Assignment'
          : 'Sameday Assignment'

    let finalDescription = description || null
    let formattedDueTime = dueTime || null

    if (finalDescription && isRawAssignmentSequence(finalDescription)) {
      const parsed = parseAndFormatAssignment(finalDescription, { defaultAssignmentType: resolvedAssignmentType })
      if (parsed.isAssignment) {
        finalDescription = parsed.formattedHtml
        if (!formattedDueTime && parsed.due) {
          formattedDueTime = parsed.due
        }
        if (parsed.assignmentType === 'Overnight Assignment' || parsed.assignmentType === 'Sameday Assignment') {
          resolvedAssignmentType = parsed.assignmentType
        }
      }
    } else if (finalDescription && !formattedDueTime) {
      const extracted = extractAssignmentFields(finalDescription)
      if (extracted.due) {
        formattedDueTime = extracted.due
      }
      if (extracted.assignmentType === 'Overnight Assignment' || extracted.assignmentType === 'Sameday Assignment') {
        resolvedAssignmentType = extracted.assignmentType
      }
    }

    // Ensure finalDescription includes the resolved Assignment Type
    finalDescription = ensureAssignmentTypeInDescription(finalDescription || '', resolvedAssignmentType)

    const supabase = getSupabaseServerClient(true)

    const { data, error } = await supabase
      .from('production_assignments')
      .insert([{
        worker_id: workerId,
        filename,
        status: 'pending',
        due_time: formattedDueTime,
        description: finalDescription,
        attachment_url: attachmentUrl || null,
        is_priority: isPriority || false,
      }])
      .select()

    if (error) {
      console.error('Assignment create error:', error)
      return NextResponse.json({ error: error.message || 'Failed to create assignment' }, { status: 500 })
    }

    // Fetch worker's email to send notification (optional)
    const { data: workerData, error: workerError } = await supabase
      .from('worker_profiles')
      .select('email, full_name')
      .eq('id', workerId)
      .single()

    if (!workerError && workerData?.email && transporter) {
      try {
        const isOvernight = resolvedAssignmentType === 'Overnight Assignment'
        const typeBadgeText = isOvernight ? '🌙 Overnight Assignment' : '☀️ Sameday Assignment'
        const typeBadgeColor = isOvernight ? '#3730a3' : '#0369a1'
        const typeBadgeBg = isOvernight ? '#eef2ff' : '#f0f9ff'
        const typeBadgeBorder = isOvernight ? '#c7d2fe' : '#bae6fd'
        const bannerGradient = isOvernight 
          ? 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)' 
          : 'linear-gradient(135deg, #075985 0%, #0284c7 100%)'

        const subject = isPriority 
          ? `[URGENT] Priority ${resolvedAssignmentType} Available - ${filename}` 
          : `[ALERT] New ${resolvedAssignmentType} Available - ${filename}`
        
        const priorityBadge = isPriority 
          ? `<div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; padding: 12px 16px; border-radius: 8px; margin: 0 0 20px 0; text-align: center; font-weight: bold; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2);">
              🔥 PRIORITY / RUSH ASSIGNMENT - Complete ASAP
             </div>`
          : ''

        const result = await transporter.sendMail({
          from: `"[WORKER] ApexScript Transcription Services" <ph.apexscriptsolutions@gmail.com>`,
          to: `"${workerData.full_name || 'Worker'}" <${workerData.email}>`,
          subject,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <div style="background: ${bannerGradient}; padding: 26px 20px; text-align: center;">
                <div style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">ApexScript Transcription Services</div>
                <div style="color: rgba(255, 255, 255, 0.85); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px;">Assignment Notification</div>
              </div>

              <div style="padding: 28px 24px;">
                ${priorityBadge}

                <div style="margin-bottom: 18px;">
                  <span style="display: inline-block; background: ${typeBadgeBg}; border: 1px solid ${typeBadgeBorder}; color: ${typeBadgeColor}; padding: 6px 14px; border-radius: 9999px; font-weight: 700; font-size: 13px;">
                    ${typeBadgeText}
                  </span>
                </div>

                <h2 style="color: #0f172a; margin: 0 0 10px 0; font-size: 20px; font-weight: 700;">
                  ${isPriority ? 'Priority ' : 'New '}${resolvedAssignmentType}
                </h2>
                
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
                  Hello <strong>${workerData.full_name || 'Worker'}</strong>,
                </p>
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                  You have a ${isPriority ? '<strong style="color: #dc2626;">PRIORITY</strong> ' : ''}<strong>${resolvedAssignmentType}</strong> assigned to you in your worker dashboard.
                </p>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                      <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 140px;">Assignment Type:</td>
                      <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${typeBadgeText}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Filename:</td>
                      <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-family: monospace;">${filename}</td>
                    </tr>
                    ${formattedDueTime ? `
                    <tr>
                      <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Due Time:</td>
                      <td style="padding: 6px 0; color: #dc2626; font-weight: 700;">${formattedDueTime}</td>
                    </tr>` : ''}
                    ${isPriority ? `
                    <tr>
                      <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Priority Status:</td>
                      <td style="padding: 6px 0; color: #dc2626; font-weight: 700;">🔥 RUSH</td>
                    </tr>` : ''}
                  </table>

                  ${finalDescription ? `
                    <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid #e2e8f0;">
                      <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Assignment Description:</div>
                      <div style="color: #1e293b; font-size: 13px; line-height: 1.6; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
                        ${finalDescription}
                      </div>
                    </div>
                  ` : ''}
                </div>

                <div style="text-align: center; margin: 26px 0 16px 0;">
                  <a href="https://apexscripts.net/dashboard" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.3);">
                    Open Worker Dashboard
                  </a>
                </div>

                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center; line-height: 1.5;">
                  This is an automated notification from ApexScript Transcription Services.<br>
                  Please do not reply directly to this email.
                </p>
              </div>
            </div>
          `,
        })
        console.log('Assignment email sent successfully to:', workerData.email)
      } catch (emailError) {
        console.error('Failed to send assignment notification email (email notifications skipped):', emailError)
        // Don't fail the request if email sending fails
      }
    }

    // Broadcast a lightweight notification to realtime clients subscribed to this worker's channel
    try {
      const channelName = `assignments:${workerId}`
      await supabase.channel(channelName).send({ type: 'broadcast', event: 'new_assignment', payload: data?.[0] })
    } catch (broadcastErr) {
      console.warn('Failed to broadcast new assignment:', broadcastErr)
    }

    return NextResponse.json({ assignment: data?.[0] })
  } catch (err: any) {
    console.error('Assignments POST error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create assignment' }, { status: 500 })
  }
}
