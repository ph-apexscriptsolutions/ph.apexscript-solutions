import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const BUCKET = 'transcripts'

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase configuration')
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey)
}

const DEFAULT_PREFERENCES = {
  hotkeys: {
    playPause: 'F1',
    rewind: 'F2',
    fastForward: 'F3',
    copyTimestamp: 'F4',
    rewindSeconds: 2,
    fastSpeed: 1.5,
  },
  shortcuts: [
    { trigger: 's1:', replacement: 'Speaker 1:' },
    { trigger: 's2:', replacement: 'Speaker 2:' },
    { trigger: 'ia:', replacement: '[inaudible]' },
    { trigger: 'ct:', replacement: '[crosstalk]' },
    { trigger: 'lt:', replacement: '[laughter]' },
    { trigger: 'ap:', replacement: '[applause]' },
  ],
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const filePath = `preferences/${userId}.json`

    const { data, error } = await supabase.storage.from(BUCKET).download(filePath)

    if (error || !data) {
      return NextResponse.json({ preferences: DEFAULT_PREFERENCES }, { status: 200 })
    }

    const jsonText = await data.text()
    const parsed = JSON.parse(jsonText)

    return NextResponse.json({
      preferences: {
        hotkeys: { ...DEFAULT_PREFERENCES.hotkeys, ...(parsed.hotkeys || {}) },
        shortcuts: parsed.shortcuts || DEFAULT_PREFERENCES.shortcuts,
      },
    }, { status: 200 })
  } catch (err: any) {
    console.error('Worker editor preferences GET error:', err)
    return NextResponse.json({ preferences: DEFAULT_PREFERENCES }, { status: 200 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, preferences } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    const filePath = `preferences/${userId}.json`
    const buffer = Buffer.from(JSON.stringify(preferences || DEFAULT_PREFERENCES, null, 2), 'utf-8')

    const { error } = await supabase.storage.from(BUCKET).upload(filePath, buffer, {
      contentType: 'application/json',
      upsert: true,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    console.error('Worker editor preferences POST error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
