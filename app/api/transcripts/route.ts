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

async function ensureBucket(supabase: any) {
  try {
    const { data: buckets, error: listErr } = await supabase.storage.listBuckets()
    if (!listErr && buckets) {
      const exists = buckets.some((b: any) => b.name === BUCKET)
      if (exists) return
    }
    await supabase.storage.createBucket(BUCKET, { public: true })
  } catch (err) {
    console.error('Bucket ensure check error:', err)
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const role = searchParams.get('role') || 'worker'
    const userId = searchParams.get('userId')
    const slot = parseInt(searchParams.get('slot') || '1', 10)

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    await ensureBucket(supabase)

    // Action: list all 5 slots for this user
    if (action === 'list') {
      const slotsData = []
      for (let i = 1; i <= 5; i++) {
        const slotPath = `${role}/${userId}/slot_${i}.txt`
        const legacyPath = i === 1 ? `${role}/${userId}.txt` : null

        let content = ''
        let updatedAt: string | null = null

        // Try slot specific path
        let { data, error } = await supabase.storage.from(BUCKET).download(slotPath)
        if (error && legacyPath) {
          // Fallback to legacy path for slot 1
          const legacy = await supabase.storage.from(BUCKET).download(legacyPath)
          if (!legacy.error && legacy.data) {
            data = legacy.data
            error = null
          }
        }

        if (!error && data) {
          content = await data.text()
          updatedAt = new Date().toISOString()
        }

        const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
        const charCount = content.length
        const preview = content.substring(0, 150).replace(/\s+/g, ' ').trim()

        slotsData.push({
          slot: i,
          title: `Draft / Revision ${i}`,
          hasContent: content.length > 0,
          wordCount,
          charCount,
          preview,
          updatedAt,
        })
      }

      // Check worker activity from worker_profiles table if available
      let workerInfo = null
      try {
        const { data: profile } = await supabase
          .from('worker_profiles')
          .select('id, full_name, role, department, last_seen')
          .eq('id', userId)
          .single()
        if (profile) {
          workerInfo = profile
        }
      } catch (e) {}

      return NextResponse.json({ slots: slotsData, worker: workerInfo }, { status: 200 })
    }

    // Default action: Get specific slot content
    const slotNum = isNaN(slot) || slot < 1 || slot > 5 ? 1 : slot
    const slotPath = `${role}/${userId}/slot_${slotNum}.txt`
    const legacyPath = slotNum === 1 ? `${role}/${userId}.txt` : null

    let { data, error } = await supabase.storage.from(BUCKET).download(slotPath)
    if (error && legacyPath) {
      const legacy = await supabase.storage.from(BUCKET).download(legacyPath)
      if (!legacy.error && legacy.data) {
        data = legacy.data
        error = null
      }
    }

    if (error) {
      return NextResponse.json({ content: null, slot: slotNum, message: 'No saved transcript found for this slot' }, { status: 200 })
    }

    const text = await data.text()
    return NextResponse.json({ content: text, slot: slotNum }, { status: 200 })
  } catch (err: any) {
    console.error('Transcript GET error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { role = 'worker', userId, content, slot = 1, title } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const slotNum = isNaN(parseInt(slot, 10)) || parseInt(slot, 10) < 1 || parseInt(slot, 10) > 5 ? 1 : parseInt(slot, 10)

    const supabase = getSupabaseClient()
    await ensureBucket(supabase)

    const slotPath = `${role}/${userId}/slot_${slotNum}.txt`
    const buffer = Buffer.from(content || '', 'utf-8')

    let { error } = await supabase.storage.from(BUCKET).upload(slotPath, buffer, {
      contentType: 'text/plain; charset=utf-8',
      upsert: true
    })

    if (error && error.message?.includes('Bucket not found')) {
      await supabase.storage.createBucket(BUCKET, { public: true })
      const retry = await supabase.storage.from(BUCKET).upload(slotPath, buffer, {
        contentType: 'text/plain; charset=utf-8',
        upsert: true
      })
      error = retry.error
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also update worker's last_seen / activity timestamp
    try {
      await supabase
        .from('worker_profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId)
    } catch (e) {}

    return NextResponse.json({ success: true, slot: slotNum, path: slotPath }, { status: 200 })
  } catch (err: any) {
    console.error('Transcript POST error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
