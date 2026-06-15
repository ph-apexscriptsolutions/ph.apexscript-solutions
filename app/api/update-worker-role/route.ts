import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const { workerId, newRole } = await request.json()

    if (!workerId || !newRole) {
      return NextResponse.json({ error: 'Missing worker ID or new role.' }, { status: 400 })
    }

    const validRoles = ['worker', 'admin', 'moderator', 'project_manager', 'human_resource', 'project_manager_human_resource']
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Update worker role in worker_profiles table
    const { error: profileError } = await supabase
      .from('worker_profiles')
      .update({ role: newRole })
      .eq('id', workerId)

    if (profileError) {
      return NextResponse.json({ error: profileError.message ?? 'Error updating worker role.' }, { status: 500 })
    }

    // Update user metadata in auth
    const { error: authError } = await supabase.auth.admin.updateUserById(workerId, {
      user_metadata: { role: newRole }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message ?? 'Error updating user role in auth.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Unexpected server error' }, { status: 500 })
  }
}
