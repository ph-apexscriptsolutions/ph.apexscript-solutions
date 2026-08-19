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
    const role = searchParams.get('role')
    const userId = searchParams.get('userId')

    if (!role || !userId) {
      return NextResponse.json({ error: 'Missing role or userId parameter' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    await ensureBucket(supabase)

    const filePath = `${role}/${userId}.txt`
    const { data, error } = await supabase.storage.from(BUCKET).download(filePath)

    if (error) {
      return NextResponse.json({ content: null, message: 'No saved transcript found' }, { status: 200 })
    }

    const text = await data.text()
    return NextResponse.json({ content: text }, { status: 200 })
  } catch (err: any) {
    console.error('Transcript GET error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { role, userId, content } = body

    if (!role || !userId) {
      return NextResponse.json({ error: 'Missing role or userId' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    await ensureBucket(supabase)

    const filePath = `${role}/${userId}.txt`
    const buffer = Buffer.from(content || '', 'utf-8')

    let { error } = await supabase.storage.from(BUCKET).upload(filePath, buffer, {
      contentType: 'text/plain; charset=utf-8',
      upsert: true
    })

    if (error && error.message?.includes('Bucket not found')) {
      await supabase.storage.createBucket(BUCKET, { public: true })
      const retry = await supabase.storage.from(BUCKET).upload(filePath, buffer, {
        contentType: 'text/plain; charset=utf-8',
        upsert: true
      })
      error = retry.error
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, path: filePath }, { status: 200 })
  } catch (err: any) {
    console.error('Transcript POST error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
