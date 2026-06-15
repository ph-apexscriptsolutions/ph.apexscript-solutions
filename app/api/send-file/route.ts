import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const workerId = formData.get('workerId') as string
    const workerName = formData.get('workerName') as string
    const fileName = formData.get('fileName') as string
    const byteSize = formData.get('byteSize') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!workerId || !workerName || !fileName || !byteSize) {
      return NextResponse.json({ error: 'Missing required upload fields.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data: existingRecords, error: checkError } = await supabase.from('production_records').select('id').eq('worker_id', workerId).ilike('file_name', fileName)

    if (checkError) {
      console.error('Production record lookup error:', checkError)
      return NextResponse.json({ error: checkError.message || 'Failed to validate file name' }, { status: 500 })
    }

    if (existingRecords && existingRecords.length > 0) {
      return NextResponse.json({ error: 'A record with that file name already exists for this worker.' }, { status: 409 })
    }

    let emailWarning: string | null = null
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        })

        await transporter.sendMail({
          from: `"[WORKER] ApexScript Solutions" <${process.env.EMAIL_USER}>`,
          to: process.env.EMAIL_USER,
          subject: `New File Upload from ${workerName}`,
          text: `Worker Name: ${workerName}\nFile Name: ${fileName}\n\nPlease find the attached file.`,
          attachments: [
            {
              filename: fileName,
              content: buffer,
            },
          ],
        })
      } catch (emailError: any) {
        console.error('Email send warning:', emailError)
        emailWarning = emailError?.message || 'Failed to send notification email.'
      }
    } else {
      console.warn('Email credentials are not configured; skipping email notification.')
      emailWarning = 'Email notification skipped because email credentials are not configured.'
    }

    const { error: insertError } = await supabase.from('production_records').insert({
      worker_id: workerId,
      file_name: fileName,
      byte_size: byteSize,
      date_completed: new Date().toISOString().split('T')[0],
      status: 'Completed',
    })

    if (insertError) {
      console.error('Production record insert error:', insertError)
      return NextResponse.json({ error: insertError.message || 'Failed to save production record' }, { status: 500 })
    }

    return NextResponse.json({ success: true, emailWarning })
  } catch (error: any) {
    console.error('Email sending error:', error)
    // Ibabalik natin ang exact error message para makita sa browser
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 })
  }
}