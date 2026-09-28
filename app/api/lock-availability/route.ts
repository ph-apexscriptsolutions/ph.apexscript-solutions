import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { workerId, locked } = body as {
      workerId: string
      locked: boolean
    }

    if (!workerId || typeof locked !== 'boolean') {
      return NextResponse.json({ error: 'Missing workerId or locked status.' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Fetch current weekly_availability
    const { data: workerData, error: fetchError } = await supabase
      .from('worker_profiles')
      .select('id, full_name, weekly_availability')
      .eq('id', workerId)
      .single()

    if (fetchError || !workerData) {
      console.error('Fetch worker error:', fetchError)
      return NextResponse.json({ error: fetchError?.message || 'Worker not found' }, { status: 404 })
    }

    const defaultDays = {
      monday: { sameday: false, overnight: false },
      tuesday: { sameday: false, overnight: false },
      wednesday: { sameday: false, overnight: false },
      thursday: { sameday: false, overnight: false },
      friday: { sameday: false, overnight: false },
    }

    const currentAvail = (workerData.weekly_availability && typeof workerData.weekly_availability === 'object')
      ? workerData.weekly_availability
      : defaultDays

    const updatedAvail = {
      ...currentAvail,
      is_locked: locked,
      locked_at: locked ? new Date().toISOString() : null,
    }

    const { error: updateError } = await supabase
      .from('worker_profiles')
      .update({
        weekly_availability: updatedAvail,
      })
      .eq('id', workerId)

    if (updateError) {
      console.error('Lock availability update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      locked,
      workerId,
      message: `Weekly availability ${locked ? 'locked' : 'unlocked'} successfully.`,
    })
  } catch (err: any) {
    console.error('Lock availability error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update availability lock' }, { status: 500 })
  }
}
