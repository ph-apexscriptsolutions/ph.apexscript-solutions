import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const rawFilename = url.searchParams.get('filename')
    const excludeId = url.searchParams.get('excludeId')

    if (!rawFilename || !rawFilename.trim()) {
      return NextResponse.json({ isDuplicate: false })
    }

    const normalized = rawFilename.trim().toLowerCase().replace(/\.txt$/i, '')
    const supabase = getSupabaseServerClient(true)

    let query = supabase
      .from('production_assignments')
      .select('id, filename, worker_id, status, created_at')
      .eq('admin_deleted', false)
      .neq('status', 'cancelled')

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data: assignments, error } = await query

    if (error) {
      console.error('Check duplicate error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const duplicate = (assignments || []).find(
      (a: any) => (a.filename || '').trim().toLowerCase().replace(/\.txt$/i, '') === normalized
    )

    if (!duplicate) {
      return NextResponse.json({ isDuplicate: false })
    }

    // Lookup worker name
    let workerName = 'Another Worker'
    if (duplicate.worker_id) {
      const { data: worker } = await supabase
        .from('worker_profiles')
        .select('full_name, email')
        .eq('id', duplicate.worker_id)
        .single()

      if (worker?.full_name) {
        workerName = worker.full_name
      } else if (worker?.email) {
        workerName = worker.email
      }
    }

    return NextResponse.json({
      isDuplicate: true,
      duplicate: {
        id: duplicate.id,
        filename: duplicate.filename,
        workerId: duplicate.worker_id,
        workerName,
        status: duplicate.status,
      },
    })
  } catch (err: any) {
    console.error('Check duplicate GET error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
