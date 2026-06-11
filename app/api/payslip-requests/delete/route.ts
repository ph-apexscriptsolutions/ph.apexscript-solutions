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
    const requestId = body?.requestId
    if (!requestId) return NextResponse.json({ error: 'Missing requestId' }, { status: 400 })

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { error } = await supabase.from('payslip_requests').update({ admin_deleted: true }).eq('id', requestId)
    if (error) {
      console.error('Payslip request delete error:', error)
      if (error.message?.includes('admin_deleted')) {
        return NextResponse.json({ error: 'Database schema is missing the admin_deleted column. Run migrations to enable admin delete.' }, { status: 500 })
      }
      return NextResponse.json({ error: error.message || 'Failed to delete payslip request' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Payslip request delete POST error:', err)
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 })
  }
}
