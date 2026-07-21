import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getDesignOption4 } from './email-designs'

const transporter = process.env.EMAIL_USER && process.env.EMAIL_PASS
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { workerId, workerName, workerEmail, comment, filename, adminName } = body

    if (!workerEmail || !comment || !adminName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!transporter) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    // Professional email template - Bold Dark Theme (Design Option 4)
    const emailHtml = getDesignOption4(workerName, filename, comment, adminName)

    // Send email
    await transporter.sendMail({
      from: `"ApexScript Transcription Services" <${process.env.EMAIL_USER}>`,
      to: workerEmail,
      subject: `Assignment Feedback - ApexScript Transcription Services`,
      html: emailHtml,
    })

    return NextResponse.json({ success: true, message: 'Comment sent successfully' })
  } catch (error: any) {
    console.error('Error sending assignment comment email:', error)
    return NextResponse.json(
      { error: 'Failed to send comment', details: error.message },
      { status: 500 }
    )
  }
}
