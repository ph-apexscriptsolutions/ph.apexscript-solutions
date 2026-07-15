import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

// GET /api/payment-history?workerId=<id>
export async function GET(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const url = new URL(request.url)
    const workerId = url.searchParams.get('workerId')

    if (!workerId) {
      return NextResponse.json({ error: 'Missing workerId parameter.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('worker_id', workerId)
      .eq('admin_deleted', false)
      .order('payment_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Payment history fetch error:', error)
      return NextResponse.json({ error: error.message || 'Failed to fetch payment history.' }, { status: 500 })
    }

    return NextResponse.json({ payments: data || [] })
  } catch (error: any) {
    console.error('Payment history GET error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch payment history.' }, { status: 500 })
  }
}

// POST /api/payment-history
export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase server configuration.' }, { status: 500 })
    }

    const body = await request.json()
    const workerId = body.workerId as string
    const amount = Number(body.amount)
    const paymentDate = body.paymentDate as string
    const senderBank = body.senderBank as string || null
    const referenceNumber = body.referenceNumber as string || null
    const recipientBank = body.recipientBank as string || null
    const notes = body.notes as string || null

    if (!workerId || isNaN(amount) || !paymentDate) {
      return NextResponse.json({ error: 'Missing required fields or invalid amount/date.' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Fetch worker's email and name
    const { data: workerData, error: workerError } = await supabase
      .from('worker_profiles')
      .select('email, full_name')
      .eq('id', workerId)
      .single()

    if (workerError) {
      console.error('Failed to fetch worker data:', workerError)
    } else {
      console.log('Worker data fetched:', { email: workerData?.email, full_name: workerData?.full_name })
    }

    console.log('Email configuration check:', { 
      hasEmailUser: !!process.env.EMAIL_USER, 
      hasEmailPass: !!process.env.EMAIL_PASS,
      transporterExists: !!transporter
    })

    const { data, error } = await supabase
      .from('payment_history')
      .insert({
        worker_id: workerId,
        amount,
        payment_date: paymentDate,
        bank_type: senderBank,
        reference_number: recipientBank,
        notes: referenceNumber ? `Ref: ${referenceNumber}${notes ? ' | ' + notes : ''}` : (notes || null),
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Payment history insert error:', error)
      return NextResponse.json({ error: error.message || 'Failed to save payment history.' }, { status: 500 })
    }

    // Send email notification to worker
    console.log('Email sending conditions check:', { 
      transporterExists: !!transporter, 
      workerEmailExists: !!workerData?.email, 
      workerNameExists: !!workerData?.full_name,
      shouldSendEmail: !!(transporter && workerData?.email && workerData?.full_name)
    })

    if (transporter && workerData?.email && workerData?.full_name) {
      try {
        const formattedAmount = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount)

        const formattedDate = new Date(paymentDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Payment Received</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">ApexScript Transcription Services</p>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Dear <strong>${workerData.full_name}</strong>,
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We are pleased to inform you that a payment has been processed and added to your payment history. Below are the details of your payment:
              </p>
              
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; font-weight: 600;">Payment Amount</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 16px; font-weight: bold; text-align: right;">${formattedAmount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; font-weight: 600;">Payment Date</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 16px; text-align: right;">${formattedDate}</td>
                  </tr>
                  ${senderBank ? `
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; font-weight: 600;">Sender Bank</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 16px; text-align: right;">${senderBank}</td>
                  </tr>
                  ` : ''}
                  ${recipientBank ? `
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; font-weight: 600;">Recipient Bank</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 16px; text-align: right;">${recipientBank}</td>
                  </tr>
                  ` : ''}
                  ${referenceNumber ? `
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; font-weight: 600;">Reference Number</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 16px; text-align: right;">${referenceNumber}</td>
                  </tr>
                  ` : ''}
                  ${notes ? `
                  <tr>
                    <td style="padding: 12px 0; color: #6b7280; font-size: 14px; font-weight: 600;">Notes</td>
                    <td style="padding: 12px 0; color: #111827; font-size: 16px; text-align: right;">${notes}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                You can view your complete payment history by logging into your worker dashboard.
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                If you have any questions or concerns regarding this payment, please don't hesitate to contact our support team.
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                Thank you for your continued hard work and dedication to the ApexScript team.
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">Best regards,</p>
                <p style="color: #111827; font-size: 16px; font-weight: bold; margin: 0;">ApexScript Transcription Services</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding: 20px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated message. Please do not reply to this email.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                © ${new Date().getFullYear()} ApexScript Transcription Services. All rights reserved.
              </p>
            </div>
          </div>
        `

        console.log('Attempting to send email to:', workerData.email)
        const result = await transporter.sendMail({
          from: `"[PAYMENT] ApexScript Transcription Services" <${process.env.EMAIL_USER}>`,
          to: `"${workerData.full_name}" <${workerData.email}>`,
          subject: `[PAYMENT RECEIVED] Payment of ${formattedAmount} - ApexScript Transcription Services`,
          html: emailHtml,
        })
        console.log('Payment notification email sent successfully. Result:', result)
      } catch (emailError) {
        console.error('Failed to send payment notification email. Error details:', emailError)
      }
    } else {
      console.log('Email not sent. Missing requirements:', {
        transporter: !!transporter,
        workerEmail: !!workerData?.email,
        workerName: !!workerData?.full_name
      })
    }

    return NextResponse.json({ 
      success: true, 
      payment: data,
      emailSent: !!(transporter && workerData?.email && workerData?.full_name),
      emailDebug: {
        transporterConfigured: !!transporter,
        workerEmail: workerData?.email,
        workerName: workerData?.full_name,
        emailEnvVars: {
          hasEmailUser: !!process.env.EMAIL_USER,
          hasEmailPass: !!process.env.EMAIL_PASS
        }
      }
    })
  } catch (error: any) {
    console.error('Payment history POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to add payment history.' }, { status: 500 })
  }
}
