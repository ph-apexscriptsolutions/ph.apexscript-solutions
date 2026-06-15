import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const { email, password, fullName, jobTitle, department, role = 'worker', location = 'United States' } = await request.json()

    if (!email || !password || !fullName || !jobTitle || !department) {
      return NextResponse.json({ error: 'Missing required worker fields.' }, { status: 400 })
    }

    const validRoles = ['worker', 'admin', 'moderator', 'project_manager', 'human_resource', 'project_manager_human_resource']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be worker, admin, moderator, project_manager, human_resource, or project_manager_human_resource.' }, { status: 400 })
    }

    const validLocations = ['Australia','Canada','India','Philippines','United Kingdom','United States']
    if (!validLocations.includes(location)) {
      return NextResponse.json({ error: 'Invalid location.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message ?? 'Auth error creating user.' }, { status: 500 })
    }

    const userId = data?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Failed to retrieve created user ID.' }, { status: 500 })
    }

    // Generate employee ID: TR-XXXX (4 random digits)
    const employeeId = `TR-${Math.floor(1000 + Math.random() * 9000)}`

    const { error: profileError } = await supabase.from('worker_profiles').insert({
      id: userId,
      full_name: fullName,
      email,
      job_title: jobTitle,
      department,
      role,
      location,
      total_files: 0,
      employee_id: employeeId,
    })

    if (profileError) {
      return NextResponse.json({ error: profileError.message ?? 'Error creating worker profile.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Unexpected server error' }, { status: 500 })
  }
}
