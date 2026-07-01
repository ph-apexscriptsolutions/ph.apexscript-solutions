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
    const paymentId = body?.paymentId

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { error } = await supabase
      .from('payment_history')
      .update({ admin_deleted: true })
      .eq('id', paymentId)

    if (error) {
      console.error('Payment history delete error:', error)
      return NextResponse.json({ error: error.message || 'Failed to delete payment record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Payment history delete POST error:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete payment record' }, { status: 500 })
  }
}
