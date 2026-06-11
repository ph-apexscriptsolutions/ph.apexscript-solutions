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
    const requestId = body.requestId
    const status = body.status

    if (!requestId || !status) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data: existing, error: fetchErr } = await supabase.from('payslip_requests').select('id').eq('id', requestId).single()

    if (fetchErr) {
      console.error('Payslip request fetch error:', fetchErr)
      return NextResponse.json({ error: fetchErr.message || 'Failed to fetch payslip request' }, { status: 500 })
    }

    const { error } = await supabase.from('payslip_requests').update({ status }).eq('id', requestId)

    if (error) {
      console.error('Payslip request update error:', error)
      return NextResponse.json({ error: error.message || 'Failed to update payslip request' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Payslip request update POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update payslip request' }, { status: 500 })
  }
}
