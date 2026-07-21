import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

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

    // Professional email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Assignment Feedback</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }
          .header {
            background: #1a1a1a;
            padding: 32px 40px;
            border-bottom: 3px solid #333;
          }
          .logo {
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .header-subtitle {
            font-size: 12px;
            color: #999;
            font-weight: 500;
            letter-spacing: 2px;
            text-transform: uppercase;
          }
          .content {
            padding: 40px;
          }
          .greeting {
            font-size: 20px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 16px;
          }
          .intro-text {
            font-size: 15px;
            color: #4a4a4a;
            margin-bottom: 28px;
            line-height: 1.7;
          }
          .comment-card {
            background: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 6px;
            padding: 28px;
            margin: 28px 0;
          }
          .comment-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e5e5e5;
          }
          .comment-icon {
            width: 32px;
            height: 32px;
            background: #1a1a1a;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
          }
          .comment-label {
            font-size: 11px;
            font-weight: 700;
            color: #1a1a1a;
            text-transform: uppercase;
            letter-spacing: 1.5px;
          }
          .comment-text {
            font-size: 15px;
            color: #2d2d2d;
            line-height: 1.7;
            white-space: pre-wrap;
          }
          .filename-section {
            background: #f0f0f0;
            border-left: 3px solid #1a1a1a;
            padding: 16px;
            margin-bottom: 20px;
            border-radius: 0 4px 4px 0;
          }
          .filename-label {
            font-size: 10px;
            font-weight: 700;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 6px;
          }
          .filename-value {
            font-size: 15px;
            font-weight: 600;
            color: #1a1a1a;
          }
          .divider {
            height: 1px;
            background: #e5e5e5;
            margin: 28px 0;
          }
          .footer {
            text-align: center;
            padding: 28px 40px;
            background: #fafafa;
            border-top: 1px solid #e5e5e5;
          }
          .footer-text {
            font-size: 13px;
            color: #666;
            margin-bottom: 6px;
          }
          .admin-name {
            font-weight: 600;
            color: #1a1a1a;
            font-size: 15px;
          }
          .company-name {
            font-weight: 600;
            color: #333;
          }
          .disclaimer {
            font-size: 11px;
            color: #999;
            margin-top: 12px;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <div class="logo">ApexScript Transcription Services</div>
            <div class="header-subtitle">Assignment Feedback</div>
          </div>
          
          <div class="content">
            <p class="greeting">Dear ${workerName},</p>
            
            <p class="intro-text">
              We hope this message finds you well. An administrator has reviewed your recent assignment submission and would like to share some feedback with you.
            </p>

            <div class="comment-card">
              ${filename ? `
              <div class="filename-section">
                <div class="filename-label">Assignment Filename</div>
                <div class="filename-value">${filename}</div>
              </div>
              ` : ''}
              <div class="comment-text">${comment}</div>
            </div>
            
            <p class="intro-text">
              Please review this feedback and incorporate it into your future assignments. If you have any questions or need clarification, please don't hesitate to reach out to the administration team.
            </p>
            
            <p class="intro-text" style="margin-bottom: 0;">
              Thank you for your continued dedication and hard work.
            </p>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <p class="footer-text">Best regards,</p>
            <p class="footer-text admin-name">${adminName}</p>
            <p class="footer-text company-name">ApexScript Transcription Services Administration</p>
            <p class="disclaimer">This is an automated message. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `

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
