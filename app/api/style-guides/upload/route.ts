import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'style-guides'

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const formData = await request.formData()
    const department = formData.get('department') as string | null
    const file = formData.get('file') as File | null

    if (!department || !file) {
      return NextResponse.json({ error: 'Missing department or file.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const contentType = file.type || 'application/pdf'
    const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const safeDept = department.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
    const uploadPath = `${safeDept}/${Date.now()}-${safeFilename}`

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Upload file to Supabase Storage
    let { error: uploadError } = await supabase.storage.from(BUCKET).upload(uploadPath, buffer, { contentType, upsert: true })

    if (uploadError) {
      if (uploadError.message?.includes('Bucket not found')) {
        const { error: createBucketError } = await supabase.storage.createBucket(BUCKET, { public: true })
        if (createBucketError) {
          console.error('Style guide bucket creation error:', createBucketError)
          return NextResponse.json({ error: createBucketError.message || 'Failed to create storage bucket.' }, { status: 500 })
        }
        const { error: retryErr } = await supabase.storage.from(BUCKET).upload(uploadPath, buffer, { contentType, upsert: true })
        if (retryErr) {
          console.error('Style guide upload retry error:', retryErr)
          return NextResponse.json({ error: retryErr.message || 'Failed to upload style guide after bucket creation.' }, { status: 500 })
        }
      } else {
        console.error('Style guide upload error:', uploadError)
        return NextResponse.json({ error: uploadError.message || 'Failed to upload style guide.' }, { status: 500 })
      }
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadPath)
    if (!urlData?.publicUrl) {
      return NextResponse.json({ error: 'Failed to generate public URL.' }, { status: 500 })
    }

    // Update the style_guides table
    const { error: updateError } = await supabase
      .from('style_guides')
      .update({ file_url: urlData.publicUrl, file_name: file.name, updated_at: new Date().toISOString() })
      .eq('department', department)

    if (updateError) {
      console.error('Style guide DB update error:', updateError)
      return NextResponse.json({ error: updateError.message || 'Failed to update style guide record.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, fileUrl: urlData.publicUrl, fileName: file.name })
  } catch (err: any) {
    console.error('Style guide upload POST error:', err)
    return NextResponse.json({ error: err.message || 'Failed to upload style guide' }, { status: 500 })
  }
}
