import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const url = new URL(request.url)
    const workerId = url.searchParams.get('workerId')
    const status = url.searchParams.get('status')

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    let query: any = supabase.from('payslip_requests').select('*').eq('admin_deleted', false).order('requested_at', { ascending: false })
    if (workerId) {
      query = query.eq('worker_id', workerId)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) {
      console.error('Payslip requests select error:', error)
      return NextResponse.json({ error: error.message || 'Failed to fetch payslip requests' }, { status: 500 })
    }

    // Enrich requests with worker full name and email for admin display
    const requests = data || []
    if (requests.length > 0) {
      const workerIds = Array.from(new Set(requests.map((r: any) => r.worker_id))).filter(Boolean)
      if (workerIds.length > 0) {
        const { data: workers, error: workerErr } = await supabase.from('worker_profiles').select('id,full_name,email').in('id', workerIds)
        if (!workerErr && workers) {
          const infoMap: Record<string, { full_name?: string; email?: string }> = {}
          workers.forEach((w: any) => { infoMap[w.id] = { full_name: w.full_name, email: w.email } })
          const enriched = requests.map((r: any) => {
            const info = infoMap[r.worker_id] || {}
            return {
              ...r,
              worker_name: info.full_name || null,
              worker_email: info.email || null,
            }
          })
          return NextResponse.json({ requests: enriched })
        }
      }
    }

    return NextResponse.json({ requests })
  } catch (error: any) {
    console.error('Payslip requests GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch payslip requests' }, { status: 500 })
  }
}
