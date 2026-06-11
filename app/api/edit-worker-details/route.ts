import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: NextRequest) {
  try {
    const { workerId, workerDetails } = await request.json()

    if (!workerId || !workerDetails || !workerDetails.email || !workerDetails.location) {
      return NextResponse.json(
        { error: 'Missing workerId or workerDetails.email or workerDetails.location' },
        { status: 400 }
      )
    }

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase configuration:', {
        supabaseUrl: !!supabaseUrl,
        serviceRoleKey: !!serviceRoleKey,
      })
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })


    const { error: authError } = await supabase.auth.admin.updateUserById(workerId, {
      email: workerDetails.email,
    })

    if (authError) {
      console.error('Auth update error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 500 }
      )
    }

    const validLocations = ['Australia','Canada','India','Philippines','United Kingdom','United States']
    if (!validLocations.includes(workerDetails.location)) {
      return NextResponse.json({ error: 'Invalid location.' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('worker_profiles')
      .update({
        full_name: workerDetails.fullName,
        job_title: workerDetails.jobTitle,
        department: workerDetails.department,
        email: workerDetails.email,
        location: workerDetails.location,
      })
      .eq('id', workerId)
      .select()
      .single()

    if (error) {
      console.error('Worker details update error:', error)
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
