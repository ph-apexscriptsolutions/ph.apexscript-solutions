import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const formData = await request.formData()
    const requestId = formData.get('requestId')
    const file = formData.get('file') as File | null

    if (!requestId || !file) {
      return NextResponse.json({ error: 'Missing requestId or file.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const contentType = file.type || 'application/pdf'

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data: existing, error: fetchErr } = await supabase.from('payslip_requests').select('id,worker_id,status').eq('id', requestId).single()

    if (fetchErr || !existing) {
      console.error('Payslip request upload fetch error:', fetchErr)
      return NextResponse.json({ error: 'Payslip request not found.' }, { status: 404 })
    }

    if (existing.status !== 'approved') {
      return NextResponse.json({ error: 'Only approved requests can be uploaded.' }, { status: 400 })
    }

    const storageBucket = process.env.SUPABASE_PAYSLIP_BUCKET
    if (!storageBucket) {
      return NextResponse.json({ error: 'Missing SUPABASE_PAYSLIP_BUCKET env variable. Set it to your Supabase storage bucket name.' }, { status: 500 })
    }

    const uploadPath = `${existing.worker_id}/payslip-${existing.id}-${Date.now()}.pdf`
    const { error: uploadError } = await supabase.storage.from(storageBucket).upload(uploadPath, buffer, { contentType })

    if (uploadError) {
      if (uploadError.message?.includes('Bucket not found')) {
        const { error: createBucketError } = await supabase.storage.createBucket(storageBucket, { public: true })
        if (createBucketError) {
          console.error('Payslip bucket creation error:', createBucketError)
          return NextResponse.json({ error: createBucketError.message || 'Failed to create storage bucket.' }, { status: 500 })
        }

        const { error: retryUploadError } = await supabase.storage.from(storageBucket).upload(uploadPath, buffer, { contentType })
        if (retryUploadError) {
          console.error('Payslip upload retry error:', retryUploadError)
          return NextResponse.json({ error: retryUploadError.message || 'Failed to upload payslip after bucket creation.' }, { status: 500 })
        }
      } else {
        console.error('Payslip upload error:', uploadError)
        return NextResponse.json({ error: uploadError.message || 'Failed to upload payslip.' }, { status: 500 })
      }
    }

    const { data: urlData } = await supabase.storage.from(storageBucket).getPublicUrl(uploadPath)
    if (!urlData?.publicUrl) {
      console.error('Payslip public URL error: no public URL returned')
      return NextResponse.json({ error: 'Failed to generate payslip URL.' }, { status: 500 })
    }

    const { error: updateError } = await supabase.from('payslip_requests').update({ payslip_url: urlData.publicUrl }).eq('id', requestId)
    if (updateError) {
      console.error('Payslip request URL update error:', updateError)
      return NextResponse.json({ success: true, payslipUrl: urlData.publicUrl, warning: updateError.message || 'Could not save payslip URL to the database. The file was uploaded successfully.' }, { status: 200 })
    }

    return NextResponse.json({ success: true, payslipUrl: urlData.publicUrl })
  } catch (error: any) {
    console.error('Payslip upload POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to upload payslip' }, { status: 500 })
  }
}
