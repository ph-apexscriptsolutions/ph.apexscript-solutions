import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const body = await request.json()
    const { recordId, fileName, dateCompleted, byteSize, workerId } = body

    if (!recordId) {
      return NextResponse.json({ error: 'Missing record ID.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Fetch existing record to get old filename and worker_id
    const { data: existingRecord, error: fetchError } = await supabase
      .from('production_records')
      .select('*')
      .eq('id', recordId)
      .single()

    if (fetchError || !existingRecord) {
      return NextResponse.json({ error: 'Production record not found.' }, { status: 404 })
    }

    const updates: any = {}
    if (typeof fileName !== 'undefined' && fileName !== null) updates.file_name = fileName.trim()
    if (typeof dateCompleted !== 'undefined' && dateCompleted !== null) updates.date_completed = dateCompleted
    if (typeof byteSize !== 'undefined' && byteSize !== null) updates.byte_size = byteSize

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No update fields provided.' }, { status: 400 })
    }

    // Perform update on production_records table using Service Role Client
    const { data: updatedRecord, error: updateError } = await supabase
      .from('production_records')
      .update(updates)
      .eq('id', recordId)
      .select()
      .single()

    if (updateError) {
      console.error('Update production record error:', updateError)
      return NextResponse.json({ error: updateError.message || 'Failed to update production record.' }, { status: 500 })
    }

    // If filename was updated, also update any matching assignment filename in production_assignments
    if (updates.file_name && existingRecord.file_name && updates.file_name !== existingRecord.file_name) {
      try {
        const targetWorkerId = workerId || existingRecord.worker_id
        if (targetWorkerId) {
          await supabase
            .from('production_assignments')
            .update({ filename: updates.file_name })
            .eq('worker_id', targetWorkerId)
            .ilike('filename', existingRecord.file_name)
        }
      } catch (syncErr) {
        console.warn('Assignment filename sync warning:', syncErr)
      }
    }

    return NextResponse.json({ success: true, record: updatedRecord })
  } catch (error: any) {
    console.error('Edit production record exception:', error)
    return NextResponse.json({ error: error.message || 'Failed to update production record' }, { status: 500 })
  }
}
