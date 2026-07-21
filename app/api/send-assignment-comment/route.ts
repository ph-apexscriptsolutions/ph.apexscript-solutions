import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { workerId, workerName, workerEmail, comment, adminName } = body

    if (!workerEmail || !comment || !adminName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create transporter using environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    // Professional email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Assignment Comment</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .header {
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .logo {
            font-size: 24px;
            font-weight: 700;
            color: #1e40af;
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 16px;
          }
          .message {
            background-color: #f3f4f6;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 24px 0;
            border-radius: 0 8px 8px 0;
          }
          .message-label {
            font-size: 12px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
          }
          .comment-text {
            font-size: 15px;
            color: #1f2937;
            line-height: 1.7;
            white-space: pre-wrap;
          }
          .footer {
            margin-top: 32px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 13px;
            color: #6b7280;
          }
          .admin-signature {
            font-weight: 600;
            color: #111827;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Apex Script Solutions</div>
          </div>
          
          <p class="greeting">Dear ${workerName},</p>
          
          <p style="margin-bottom: 16px;">
            We hope this message finds you well. An administrator has reviewed your recent assignment submission and would like to share some feedback with you.
          </p>
          
          <div class="message">
            <div class="message-label">Assignment Comment</div>
            <div class="comment-text">${comment}</div>
          </div>
          
          <p style="margin-bottom: 16px;">
            Please review this feedback and incorporate it into your future assignments. If you have any questions or need clarification, please don't hesitate to reach out to the administration team.
          </p>
          
          <p>
            Thank you for your continued dedication and hard work.
          </p>
          
          <div class="footer">
            <p>Best regards,</p>
            <p class="admin-signature">${adminName}</p>
            <p style="margin-top: 8px;">Apex Script Solutions Administration</p>
            <p style="margin-top: 16px; font-size: 11px;">
              This is an automated message. Please do not reply directly to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@apexscriptsolutions.com',
      to: workerEmail,
      subject: `Assignment Feedback - Apex Script Solutions`,
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
