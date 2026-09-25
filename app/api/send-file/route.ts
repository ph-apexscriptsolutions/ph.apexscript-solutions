import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const workerId = formData.get('workerId') as string
    const workerName = formData.get('workerName') as string
    const fileName = formData.get('fileName') as string
    const byteSize = formData.get('byteSize') as string

    const assignmentId = formData.get('assignmentId') as string | null
    const isAdminParam = formData.get('isAdmin') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!workerId || !workerName || !fileName || !byteSize) {
      return NextResponse.json({ error: 'Missing required upload fields.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Helper to normalize file base names (strip known extension, punctuation, trim, lowercase)
    const cleanFileBase = (name: string): string => {
      if (!name) return ''
      return name
        .trim()
        .replace(/\.(txt|docx?|pdf|mp3|wav|m4a|aac|flac|ogg|wma)$/i, '') // strip real file extension
        .replace(/[.,;:!]+$/, '') // strip trailing dots or punctuation
        .trim()
        .toLowerCase()
    }

    // Helper to extract alternative filenames from assignment description (e.g. "Filename: 0924.2012-2028.8494.")
    const extractAlternativeNames = (description?: string | null): string[] => {
      if (!description) return []
      const names: string[] = []
      const fnMatch = description.match(/(?:Filename|File\s*Name)\s*:\s*([^\s<]+)/i)
      if (fnMatch && fnMatch[1]) {
        names.push(cleanFileBase(fnMatch[1]))
      }
      const codeMatch = description.match(/Code\s*:\s*([^\s<]+)/i)
      if (codeMatch && codeMatch[1]) {
        names.push(cleanFileBase(codeMatch[1]))
      }
      return names
    }

    // Check if the caller is an admin (can bypass worker assignment restriction)
    let isCallerAdmin = isAdminParam
    if (!isCallerAdmin) {
      const { data: callerProfile } = await supabase
        .from('worker_profiles')
        .select('role')
        .eq('id', workerId)
        .single()
      const role = callerProfile?.role
      if (role === 'admin' || role === 'project_manager' || role === 'project_manager_human_resource') {
        isCallerAdmin = true
      }
    }

    // Check if the filename matches any of the worker's assigned assignments
    // Include both 'pending' and 'needs_revision' statuses so workers can resubmit revisions
    const { data: assignments, error: assignmentsError } = await supabase
      .from('production_assignments')
      .select('id, filename, status, description, revision_reason, revision_note')
      .eq('worker_id', workerId)
      .in('status', ['pending', 'needs_revision'])

    if (assignmentsError) {
      console.error('Assignments lookup error:', assignmentsError)
      return NextResponse.json({ error: assignmentsError.message || 'Failed to validate assignment' }, { status: 500 })
    }

    const uploadedFileNameWithoutExt = fileName.replace(/\.[^/.]+$/, '')
    const normalizedUploadedBase = cleanFileBase(fileName)

    // Match assignment by:
    // 1. Explicit assignmentId if provided from Transcript Editor or Dashboard
    // 2. Exact or normalized assignment.filename
    // 3. Alternative filenames specified in description (e.g. "Filename: 0924.2012-2028.8494.")
    let matchedAssignment: any = null

    if (assignmentId) {
      matchedAssignment = assignments?.find((a: any) => String(a.id) === String(assignmentId))
    }

    if (!matchedAssignment && assignments && assignments.length > 0) {
      matchedAssignment = assignments.find((assignment: any) => {
        // Direct exact match
        if (assignment.filename === uploadedFileNameWithoutExt || assignment.filename === fileName) {
          return true
        }
        // Normalized base comparison
        const assignedBase = cleanFileBase(assignment.filename || '')
        if (assignedBase && assignedBase === normalizedUploadedBase) {
          return true
        }
        // Check alternative filenames from description
        const altNames = extractAlternativeNames(assignment.description)
        if (altNames.some((alt) => alt === normalizedUploadedBase || alt === cleanFileBase(fileName))) {
          return true
        }
        return false
      })
    }

    const isAssigned = !!matchedAssignment || isCallerAdmin

    if (!isAssigned) {
      // Find out why for a helpful, clear error message
      const { data: allWorkerAssignments } = await supabase
        .from('production_assignments')
        .select('id, filename, status, description')
        .eq('worker_id', workerId)
        .order('created_at', { ascending: false })
        .limit(20)

      const completedMatch = allWorkerAssignments?.find((a: any) => {
        const assignedBase = cleanFileBase(a.filename || '')
        const altNames = extractAlternativeNames(a.description)
        return (
          assignedBase === normalizedUploadedBase ||
          altNames.includes(normalizedUploadedBase) ||
          a.filename === uploadedFileNameWithoutExt
        )
      })

      if (completedMatch?.status === 'done') {
        return NextResponse.json({
          error: `This file ("${fileName}") has already been submitted and marked as completed on your account.`,
        }, { status: 409 })
      }

      if (completedMatch?.status === 'cancelled') {
        return NextResponse.json({
          error: `This assignment ("${fileName}") was cancelled by the admin and cannot be submitted.`,
        }, { status: 403 })
      }

      const activeList = assignments && assignments.length > 0
        ? assignments.map((a: any) => a.filename).join(', ')
        : 'None'

      const debugInfo = {
        workerId,
        uploadedFileName: fileName,
        uploadedFileNameWithoutExt,
        normalizedUploadedBase,
        assignmentsFound: assignments,
        assignmentsCount: assignments?.length || 0,
        assignmentFilenames: assignments?.map((a: any) => a.filename) || [],
      }

      return NextResponse.json({
        error: assignments && assignments.length > 0
          ? `File "${fileName}" does not match your active assignments (${activeList}). Please check the assignment code or select it from your assignments.`
          : 'You currently have no pending assignments assigned by the admin.',
        debug: debugInfo
      }, { status: 403 })
    }

    // If this is a revision resubmission, delete the old production record first
    const isRevisionResubmission = matchedAssignment?.status === 'needs_revision'
    if (isRevisionResubmission) {
      try {
        await supabase
          .from('production_records')
          .delete()
          .eq('worker_id', workerId)
          .ilike('file_name', `${matchedAssignment.filename}%`)
        console.log('Deleted old production record for revision resubmission')
      } catch (deleteErr) {
        console.warn('Could not delete old production record:', deleteErr)
      }
    }

    // For non-revision uploads, check for existing duplicate records
    if (!isRevisionResubmission) {
      const { data: existingRecords, error: checkError } = await supabase.from('production_records').select('id').eq('worker_id', workerId).ilike('file_name', fileName)

      if (checkError) {
        console.error('Production record lookup error:', checkError)
        return NextResponse.json({ error: checkError.message || 'Failed to validate file name' }, { status: 500 })
      }

      if (existingRecords && existingRecords.length > 0) {
        return NextResponse.json({ error: 'A record with that file name already exists for this worker.' }, { status: 409 })
      }
    }

    let emailWarning: string | null = null
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        })

        const emailSubject = isRevisionResubmission
          ? `Revision Resubmission from ${workerName}: ${fileName}`
          : `New File Upload from ${workerName}`

        await transporter.sendMail({
          from: `"[WORKER] ApexScript Transcription Services" <${process.env.EMAIL_USER}>`,
          to: process.env.EMAIL_USER,
          bcc: 'ph.apexscriptsolutions@gmail.com',
          subject: emailSubject,
          text: `Worker Name: ${workerName}\nFile Name: ${fileName}${isRevisionResubmission ? '\n\n⚠️ This is a REVISION RESUBMISSION. The worker has corrected and resubmitted this file.' : ''}\n\nPlease find the attached file.`,
          attachments: [
            {
              filename: fileName,
              content: buffer,
            },
          ],
        })
      } catch (emailError: any) {
        console.error('Email send warning:', emailError)
        emailWarning = emailError?.message || 'Failed to send notification email.'
      }
    } else {
      console.warn('Email credentials are not configured; skipping email notification.')
      emailWarning = 'Email notification skipped because email credentials are not configured.'
    }

    const { error: insertError } = await supabase.from('production_records').insert({
      worker_id: workerId,
      file_name: fileName,
      byte_size: byteSize,
      date_completed: new Date().toISOString().split('T')[0],
      status: 'Completed',
    })

    if (insertError) {
      console.error('Production record insert error:', insertError)
      return NextResponse.json({ error: insertError.message || 'Failed to save production record' }, { status: 500 })
    }

    // Mark the matched assignment as 'done'
    if (matchedAssignment?.id) {
      const { error: updateAssignmentError } = await supabase
        .from('production_assignments')
        .update({ status: 'done' })
        .eq('id', matchedAssignment.id)

      if (updateAssignmentError) {
        console.error('Failed to update assignment status to done:', updateAssignmentError)
      }
    }

    return NextResponse.json({ success: true, emailWarning, isRevisionResubmission, assignmentId: matchedAssignment?.id })
  } catch (error: any) {
    console.error('Email sending error:', error)
    // Ibabalik natin ang exact error message para makita sa browser
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 })
  }
}