import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// GET /api/payment-history?workerId=<id>
export async function GET(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const url = new URL(request.url)
    const workerId = url.searchParams.get('workerId')

    if (!workerId) {
      return NextResponse.json({ error: 'Missing workerId parameter.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('worker_id', workerId)
      .eq('admin_deleted', false)
      .order('payment_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Payment history fetch error:', error)
      return NextResponse.json({ error: error.message || 'Failed to fetch payment history.' }, { status: 500 })
    }

    return NextResponse.json({ payments: data || [] })
  } catch (error: any) {
    console.error('Payment history GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch payment history.' }, { status: 500 })
  }
}

// POST /api/payment-history
export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const body = await request.json()
    const workerId = body.workerId as string
    const amount = Number(body.amount)
    const paymentDate = body.paymentDate as string
    const senderBank = body.senderBank as string || null
    const referenceNumber = body.referenceNumber as string || null
    const recipientBank = body.recipientBank as string || null
    const notes = body.notes as string || null

    if (!workerId || isNaN(amount) || !paymentDate) {
      return NextResponse.json({ error: 'Missing required fields or invalid amount/date.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data, error } = await supabase
      .from('payment_history')
      .insert({
        worker_id: workerId,
        amount,
        payment_date: paymentDate,
        bank_type: senderBank,
        reference_number: recipientBank,
        notes: referenceNumber ? `Ref: ${referenceNumber}${notes ? ' | ' + notes : ''}` : (notes || null),
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Payment history insert error:', error)
      return NextResponse.json({ error: error.message || 'Failed to save payment history.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, payment: data })
  } catch (error: any) {
    console.error('Payment history POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to add payment history.' }, { status: 500 })
  }
}
