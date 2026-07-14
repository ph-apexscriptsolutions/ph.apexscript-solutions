import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const { id } = await params
    const body = await request.json()
    const { department_permissions } = body

    if (!department_permissions || !Array.isArray(department_permissions)) {
      return NextResponse.json({ error: 'Invalid department permissions' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data, error } = await supabase
      .from('worker_profiles')
      .update({ department_permissions })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating worker department permissions:', error)
      return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error('Error in worker permissions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
