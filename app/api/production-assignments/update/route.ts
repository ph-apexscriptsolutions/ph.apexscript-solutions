import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseAndFormatAssignment, isRawAssignmentSequence, extractAssignmentFields } from '@/utils/assignment-formatter'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const body = await request.json()
    const { assignmentId, status, filename, dueTime, description, isPriority } = body

    if (!assignmentId) {
      return NextResponse.json({ error: 'Missing assignmentId' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Fetch existing assignment to get old filename and worker_id
    const { data: existingAssignment } = await supabase
      .from('production_assignments')
      .select('*')
      .eq('id', assignmentId)
      .single()

    const updates: any = {}
    if (status) updates.status = status
    if (typeof filename !== 'undefined' && filename !== null) updates.filename = filename.trim()
    if (typeof dueTime !== 'undefined') updates.due_time = dueTime
    if (typeof description !== 'undefined') {
      if (description && isRawAssignmentSequence(description)) {
        const parsed = parseAndFormatAssignment(description)
        if (parsed.isAssignment) {
          updates.description = parsed.formattedHtml
          if (typeof dueTime === 'undefined' && parsed.due) {
            updates.due_time = parsed.due
          }
        } else {
          updates.description = description
        }
      } else {
        updates.description = description
        if (typeof dueTime === 'undefined' && description) {
          const extracted = extractAssignmentFields(description)
          if (extracted.due) {
            updates.due_time = extracted.due
          }
        }
      }
    }
    if (typeof isPriority !== 'undefined') updates.is_priority = Boolean(isPriority)

    // Always update description_updated_at timestamp whenever assignment details are edited
    if (typeof filename !== 'undefined' || typeof description !== 'undefined' || typeof dueTime !== 'undefined') {
      updates.description_updated_at = new Date().toISOString()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No update fields provided' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('production_assignments')
      .update(updates)
      .eq('id', assignmentId)
      .select()

    if (error) {
      console.error('Assignment update error:', error)
      return NextResponse.json({ error: error.message || 'Failed to update assignment' }, { status: 500 })
    }

    // Sync updated filename to production_records if existing assignment was found
    if (updates.filename && existingAssignment?.filename && updates.filename !== existingAssignment.filename) {
      try {
        if (existingAssignment.worker_id) {
          await supabase
            .from('production_records')
            .update({ file_name: updates.filename })
            .eq('worker_id', existingAssignment.worker_id)
            .ilike('file_name', existingAssignment.filename)
        }
      } catch (syncErr) {
        console.warn('Production record filename sync error:', syncErr)
      }
    }

    return NextResponse.json({ assignment: data?.[0] })
  } catch (err: any) {
    console.error('Assignment update POST error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update assignment' }, { status: 500 })
  }
}
