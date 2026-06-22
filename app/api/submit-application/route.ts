import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Initialize Nodemailer transporter with Gmail
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
    const { fullName, email, phone, jobTitle, department, experience, coverLetter } = body

    if (!fullName || !email || !phone || !jobTitle || !department || !experience || !coverLetter) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (!transporter) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    // Send email notification to ph.apexscriptsolutions@gmail.com
    await transporter.sendMail({
      from: `"[NEW APPLICANT] ApexScript Solutions" <${process.env.EMAIL_USER}>`,
      to: 'ph.apexscriptsolutions@gmail.com',
      subject: '[NEW APPLICANT] Application from ' + fullName,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #0891b2; padding-bottom: 10px;">New Applicant Application</h2>
          <p style="color: #666; line-height: 1.6;">A new applicant has submitted an application. Here are the details:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Applicant Information</h3>
            <p style="color: #666; line-height: 1.6;"><strong>Full Name:</strong> ${fullName}</p>
            <p style="color: #666; line-height: 1.6;"><strong>Email:</strong> ${email}</p>
            <p style="color: #666; line-height: 1.6;"><strong>Phone:</strong> ${phone}</p>
            <p style="color: #666; line-height: 1.6;"><strong>Position Applying For:</strong> ${jobTitle}</p>
            <p style="color: #666; line-height: 1.6;"><strong>Department:</strong> ${department}</p>
            <p style="color: #666; line-height: 1.6;"><strong>Years of Experience:</strong> ${experience}</p>
          </div>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Cover Letter / Additional Information</h3>
            <p style="color: #666; line-height: 1.6; white-space: pre-wrap;">${coverLetter}</p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">Please review this application and contact the applicant if you would like to proceed with the hiring process.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; margin: 0;">This is an automated message. Please do not reply.</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Submit application error:', err)
    return NextResponse.json({ error: err.message || 'Failed to submit application' }, { status: 500 })
  }
}
