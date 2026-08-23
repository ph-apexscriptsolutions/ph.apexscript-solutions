import nodemailer from 'nodemailer'
import { SupabaseClient } from '@supabase/supabase-js'

export const getMailTransporter = () => {
  const emailUser = process.env.EMAIL_USER
  const emailPass = process.env.EMAIL_PASS
  if (!emailUser || !emailPass) {
    return null
  }

  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  })
}

export interface SendAnnouncementEmailOptions {
  supabase: SupabaseClient
  categoryTitle: string
  categoryBadge: string
  message: string
}

export interface EmailDebugResult {
  emailConfigured: boolean
  workersFound: number
  workersWithEmail: number
  emailSent: boolean
  error: string | null
}

export async function sendAnnouncementEmailToWorkers({
  supabase,
  categoryTitle,
  categoryBadge,
  message,
}: SendAnnouncementEmailOptions): Promise<EmailDebugResult> {
  const debug: EmailDebugResult = {
    emailConfigured: false,
    workersFound: 0,
    workersWithEmail: 0,
    emailSent: false,
    error: null,
  }

  try {
    const transporter = getMailTransporter()
    const emailUser = process.env.EMAIL_USER

    if (!transporter || !emailUser) {
      debug.error = 'Email service is not configured (EMAIL_USER and EMAIL_PASS environment variables are required)'
      console.warn('[Announcement Email]', debug.error)
      return debug
    }

    debug.emailConfigured = true

    // Fetch all worker profiles
    const { data: workers, error: workersError } = await supabase
      .from('worker_profiles')
      .select('email, full_name')

    if (workersError) {
      debug.error = `Failed to fetch worker profiles: ${workersError.message}`
      console.error('[Announcement Email]', debug.error)
      return debug
    }

    if (!workers || workers.length === 0) {
      debug.error = 'No worker profiles found'
      console.warn('[Announcement Email]', debug.error)
      return debug
    }

    debug.workersFound = workers.length

    // Build deduplicated BCC recipient list
    const seen = new Set<string>()
    const workerEmails: string[] = []

    for (const w of workers) {
      const email = w.email ? String(w.email).trim() : ''
      const lower = email.toLowerCase()
      if (lower && lower.includes('@') && !seen.has(lower)) {
        seen.add(lower)
        const name = w.full_name ? String(w.full_name).trim().replace(/[<>\r\n"]/g, '') : ''
        if (name) {
          workerEmails.push(`"${name}" <${email}>`)
        } else {
          workerEmails.push(email)
        }
      }
    }

    debug.workersWithEmail = workerEmails.length

    if (workerEmails.length === 0) {
      debug.error = 'No valid worker email addresses found in worker profiles'
      console.warn('[Announcement Email]', debug.error)
      return debug
    }

    const subject = `[${categoryBadge}] New ${categoryTitle} Announcement`
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #f4f4f5; padding-bottom: 16px;">
          <span style="display: inline-block; padding: 4px 12px; background-color: #f4f4f5; color: #18181b; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">
            ${categoryTitle}
          </span>
          <h2 style="color: #18181b; margin: 8px 0 4px 0; font-size: 20px; font-weight: 700;">New Announcement</h2>
          <p style="color: #71717a; font-size: 13px; margin: 0;">ApexScript Transcription Services</p>
        </div>
        <div style="color: #27272a; line-height: 1.6; margin: 20px 0; padding: 18px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 15px;">
          ${message}
        </div>
        <div style="margin: 24px 0 16px; text-align: center;">
          <p style="color: #52525b; font-size: 14px; margin: 0;">Please log in to your dashboard for more details.</p>
        </div>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0 16px;" />
        <p style="color: #a1a1aa; font-size: 12px; margin: 0; text-align: center;">
          This is an automated notification sent to all workers via BCC. Please do not reply directly to this email.
        </p>
      </div>
    `

    const sendResult = await transporter.sendMail({
      from: `"[ANNOUNCEMENT] ApexScript Transcription Services" <${emailUser}>`,
      to: emailUser,
      bcc: workerEmails,
      subject,
      html,
    })

    console.log(`[Announcement Email] Successfully sent to ${workerEmails.length} workers via BCC. MessageId: ${sendResult.messageId}`)
    debug.emailSent = true
    return debug
  } catch (err: any) {
    debug.error = `Email sending failed: ${err?.message || String(err)}`
    console.error('[Announcement Email] Exception:', err)
    return debug
  }
}
