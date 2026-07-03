import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'assignment-attachments'

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const formData = await request.formData()
    const workerId = formData.get('workerId') as string | null
    const file = formData.get('file') as File | null

    if (!workerId || !file) {
      return NextResponse.json({ error: 'Missing workerId or file.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const contentType = file.type || 'application/octet-stream'
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const uploadPath = `${workerId}/attachment-${Date.now()}-${safeFilename}`

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Attempt upload; create bucket if it doesn't exist yet
    let { error: uploadError } = await supabase.storage.from(BUCKET).upload(uploadPath, buffer, { contentType })

    if (uploadError) {
      if (uploadError.message?.includes('Bucket not found')) {
        const { error: createBucketError } = await supabase.storage.createBucket(BUCKET, { public: true })
        if (createBucketError) {
          console.error('Attachment bucket creation error:', createBucketError)
          return NextResponse.json({ error: createBucketError.message || 'Failed to create storage bucket.' }, { status: 500 })
        }
        const { error: retryErr } = await supabase.storage.from(BUCKET).upload(uploadPath, buffer, { contentType })
        if (retryErr) {
          console.error('Attachment upload retry error:', retryErr)
          return NextResponse.json({ error: retryErr.message || 'Failed to upload attachment after bucket creation.' }, { status: 500 })
        }
      } else {
        console.error('Attachment upload error:', uploadError)
        return NextResponse.json({ error: uploadError.message || 'Failed to upload attachment.' }, { status: 500 })
      }
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadPath)
    if (!urlData?.publicUrl) {
      return NextResponse.json({ error: 'Failed to generate attachment URL.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, attachmentUrl: urlData.publicUrl, filename: file.name })
  } catch (error: any) {
    console.error('Attachment upload POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to upload attachment' }, { status: 500 })
  }
}
