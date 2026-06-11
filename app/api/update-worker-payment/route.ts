import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: NextRequest) {
  let client: ReturnType<typeof createClient> | null = null

    try {
      const { workerId, basePaymentPer60kb } = await request.json()

      if (!workerId || basePaymentPer60kb === undefined) {
        return NextResponse.json(
          { error: 'Missing workerId or basePaymentPer60kb' },
          { status: 400 }
        )
      }

      // Validate the payment rate is one of the allowed values
      const allowedRates = [700, 800, 900, 1000, 1100, 1200]
      if (!allowedRates.includes(basePaymentPer60kb)) {
        return NextResponse.json(
          { error: `Invalid payment rate. Allowed values: ${allowedRates.join(', ')}` },
          { status: 400 }
        )
      }

      if (!supabaseUrl || !supabaseServiceRoleKey) {
        return NextResponse.json({ error: 'Missing Supabase configuration.' }, { status: 500 })
      }

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

      // Update the worker's payment rate via the HTTP API
      const { data, error } = await supabaseAdmin
        .from('worker_profiles')
        .update({ base_payment_per_60kb: basePaymentPer60kb })
        .eq('id', workerId)
        .select()

      if (error) {
        console.error('Supabase update error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
      }

      return NextResponse.json({ data: Array.isArray(data) ? data[0] : data })
    } catch (err: any) {
      console.error('Payment update error:', err)
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
