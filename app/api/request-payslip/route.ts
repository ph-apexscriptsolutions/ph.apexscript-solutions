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
    const cutoffStart = body.cutoffStart as string
    const cutoffEnd = body.cutoffEnd as string

    if (!workerId || !cutoffStart || !cutoffEnd) {
      return NextResponse.json({ error: 'Missing required fields for payslip request.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data, error } = await supabase.from('payslip_requests').insert({
      worker_id: workerId,
      cutoff_start: cutoffStart,
      cutoff_end: cutoffEnd,
      status: 'pending',
      requested_at: new Date().toISOString(),
    }).select().single()

    if (error) {
      console.error('Payslip request insert error:', error)
      return NextResponse.json({ error: error.message || 'Failed to save payslip request' }, { status: 500 })
    }

    return NextResponse.json({ success: true, request: data })
  } catch (error: any) {
    console.error('Payslip request error:', error)
    return NextResponse.json({ error: error.message || 'Failed to request payslip' }, { status: 500 })
  }
}
