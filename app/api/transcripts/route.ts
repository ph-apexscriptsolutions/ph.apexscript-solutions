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

    // Action: list all 2 slots (Save Slot & Auto-Save) for this user
    if (action === 'list') {
      const slotsData = []
      for (let i = 1; i <= 2; i++) {
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
        // Fallback to legacy slot 5 for auto-save (slot 2) if migrating
        if (error && i === 2) {
          const legacyAuto = await supabase.storage.from(BUCKET).download(`${role}/${userId}/slot_5.txt`)
          if (!legacyAuto.error && legacyAuto.data) {
            data = legacyAuto.data
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
          title: i === 2 ? 'Auto-Save' : 'Save Slot',
          hasContent: content.length > 0,
          wordCount,
          charCount,
          preview,
          updatedAt,
        })
      }

      // Check client platform info (desktop vs browser)
      let clientInfo = { clientType: 'browser', lastActive: null }
      try {
        const clientInfoPath = `${role}/${userId}/client_info.json`
        const { data: cData, error: cErr } = await supabase.storage.from(BUCKET).download(clientInfoPath)
        if (!cErr && cData) {
          const parsed = JSON.parse(await cData.text())
          if (parsed && parsed.clientType) {
            clientInfo = parsed
          }
        }
      } catch (e) {}

      // Check worker activity from worker_profiles table if available
      let workerInfo = null
      try {
        const { data: profile } = await supabase
          .from('worker_profiles')
          .select('id, full_name, role, department, last_seen')
          .eq('id', userId)
          .single()
        if (profile) {
          workerInfo = { ...profile, client_type: clientInfo.clientType }
        }
      } catch (e) {}

      return NextResponse.json({ slots: slotsData, worker: workerInfo, clientInfo }, { status: 200 })
    }

    // Default action: Get specific slot content (1 = Save Slot, 2 = Auto-Save)
    const slotNum = isNaN(slot) || slot < 1 || slot > 2 ? 1 : slot
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
    // Fallback to legacy slot 5 for auto-save (slot 2)
    if (error && slotNum === 2) {
      const legacyAuto = await supabase.storage.from(BUCKET).download(`${role}/${userId}/slot_5.txt`)
      if (!legacyAuto.error && legacyAuto.data) {
        data = legacyAuto.data
        error = null
      }
    }

    if (error || !data) {
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
    const {
      role = 'worker',
      userId,
      content,
      slot = 1,
      title,
      clientType = 'browser',
      actorRole = role,
      actorUserId = userId,
    } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const slotNum = isNaN(parseInt(slot, 10)) || parseInt(slot, 10) < 1 || parseInt(slot, 10) > 2 ? 1 : parseInt(slot, 10)

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

    // Only update worker activity timestamp and client platform info IF:
    // The request was initiated by the worker themselves, NEVER when an admin is inspecting/saving a worker's draft
    const isWorkerThemselves = actorRole !== 'admin' && (!actorUserId || actorUserId === userId)

    if (isWorkerThemselves) {
      // Save client platform metadata (desktop app vs web browser)
      try {
        const clientInfoPath = `${role}/${userId}/client_info.json`
        const clientInfoBuf = Buffer.from(
          JSON.stringify({
            clientType: clientType || 'browser',
            lastActive: new Date().toISOString(),
            activeSlot: slotNum,
          }),
          'utf-8'
        )
        await supabase.storage.from(BUCKET).upload(clientInfoPath, clientInfoBuf, {
          contentType: 'application/json',
          upsert: true,
        })
      } catch (e) {}

      // Also update worker's last_seen / activity timestamp
      try {
        await supabase
          .from('worker_profiles')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', userId)
      } catch (e) {}
    }

    return NextResponse.json({ success: true, slot: slotNum, path: slotPath }, { status: 200 })
  } catch (err: any) {
    console.error('Transcript POST error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
