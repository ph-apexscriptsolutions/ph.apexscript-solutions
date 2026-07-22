import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const body = await request.json()
    const workerId = body.workerId as string
    const fileName = body.fileName as string
    const dateCompleted = body.dateCompleted as string
    const byteSize = body.byteSize as string
    const isAdmin = body.isAdmin === true

    if (!workerId || !fileName || !dateCompleted || !byteSize) {
      return NextResponse.json({ error: 'Missing required fields for manual record entry.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Only check assignment validation if not an admin
    if (!isAdmin) {
      // Check if the filename matches any of the worker's assigned assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('production_assignments')
        .select('filename')
        .eq('worker_id', workerId)
        .eq('status', 'pending')

      if (assignmentsError) {
        console.error('Assignments lookup error:', assignmentsError)
        return NextResponse.json({ error: assignmentsError.message || 'Failed to validate assignment' }, { status: 500 })
      }

      // Check if the uploaded filename exactly matches any assigned filename
      const isAssigned = assignments?.some((assignment: any) => assignment.filename === fileName)

      if (!isAssigned) {
        return NextResponse.json({ error: 'This file is not assigned to this worker. Please only add records for files that have been assigned by the admin.' }, { status: 403 })
      }
    }

    const { data: existingRecords, error: checkError } = await supabase.from('production_records').select('id').eq('worker_id', workerId).ilike('file_name', fileName)

    if (checkError) {
      console.error('Manual production record lookup error:', checkError)
      return NextResponse.json({ error: checkError.message || 'Failed to validate file name' }, { status: 500 })
    }

    if (existingRecords && existingRecords.length > 0) {
      return NextResponse.json({ error: 'A record with that file name already exists for this worker.' }, { status: 409 })
    }

    const { error } = await supabase.from('production_records').insert({
      worker_id: workerId,
      file_name: fileName,
      date_completed: dateCompleted,
      byte_size: byteSize,
      status: 'Completed',
    })

    if (error) {
      console.error('Manual production record insert error:', error)
      return NextResponse.json({ error: error.message || 'Failed to save manual record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Manual record add error:', error)
    return NextResponse.json({ error: error.message || 'Failed to add manual record' }, { status: 500 })
  }
}
