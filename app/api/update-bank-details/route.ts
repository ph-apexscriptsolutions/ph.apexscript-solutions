import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { workerId, bankDetails } = await request.json()

    if (!workerId || !bankDetails) {
      return NextResponse.json(
        { error: 'Missing workerId or bankDetails' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const { data, error } = await supabase
      .from('worker_profiles')
      .update({
        bank_name: bankDetails.bankName,
        account_number: bankDetails.accountNumber,
        account_type: bankDetails.accountType,
        routing_number: bankDetails.routingNumber,
        employee_id: bankDetails.employeeId,
      })
      .eq('id', workerId)
      .select()
      .single()

    if (error) {
      console.error('Bank update error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
