/**
 * Helper utility for payslip email notifications
 */

export interface CutoffDetails {
  cutoffLabel: string
  dateRange: string
}

export function formatCutoffDetails(cutoffStart: string, cutoffEnd?: string): CutoffDetails {
  try {
    const [y, m, day] = cutoffStart.split('-').map(Number)
    const monthName = new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long' })
    const cutoffLabel = `${monthName} ${y} — ${day <= 14 ? 'First Cutoff' : 'Second Cutoff'}`

    let dateRange = cutoffStart
    if (cutoffEnd) {
      const [ey, em, eday] = cutoffEnd.split('-').map(Number)
      const startMonthName = new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short' })
      const endMonthName = new Date(ey, em - 1, 1).toLocaleString('en-US', { month: 'short' })
      if (y === ey && m === em) {
        dateRange = `${startMonthName} ${day} – ${eday}, ${y}`
      } else {
        dateRange = `${startMonthName} ${day}, ${y} – ${endMonthName} ${eday}, ${ey}`
      }
    }

    return { cutoffLabel, dateRange }
  } catch {
    return {
      cutoffLabel: cutoffStart,
      dateRange: cutoffEnd ? `${cutoffStart} to ${cutoffEnd}` : cutoffStart,
    }
  }
}

export function buildPayslipApprovedEmailHtml({
  workerName,
  cutoffLabel,
  dateRange,
  approvedAt,
}: {
  workerName: string
  cutoffLabel: string
  dateRange: string
  approvedAt?: string
}): string {
  const currentYear = new Date().getFullYear()
  const displayDate = approvedAt || new Date().toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip Request Approved</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 32px; border-bottom: 3px solid #059669;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #ffffff; font-size: 19px; font-weight: 700; letter-spacing: 0.5px;">APEXSCRIPT SOLUTIONS</h1>
                    <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Worker Portal &bull; Payroll Administration</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              <!-- Status Badge -->
              <div style="margin-bottom: 20px;">
                <span style="display: inline-block; background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                  &#10003; Request Approved &bull; Pending Upload
                </span>
              </div>

              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 22px; font-weight: 700; line-height: 1.3;">
                Your Payslip Request Has Been Approved
              </h2>

              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                Dear <strong>${workerName}</strong>,
              </p>

              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                We are writing to notify you that your payslip request for <strong>${cutoffLabel}</strong> has been officially reviewed and approved by the administration.
              </p>

              <!-- Notice Box -->
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <h4 style="margin: 0 0 6px 0; color: #92400e; font-size: 14px; font-weight: 700;">
                  &#9203; Document Upload in Progress
                </h4>
                <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #78350f;">
                  Your payslip document is currently being prepared and queued for upload by our administrative team. 
                  <strong>Please wait for the payslip to be uploaded.</strong> You do not need to submit another request.
                </p>
                <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.6; color: #78350f;">
                  As soon as your file has been uploaded, <strong>you will receive an automatic email notification</strong> containing the direct download link.
                </p>
              </div>

              <!-- Request Details Summary Card -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 14px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; font-weight: 700;">
                  Request Summary
                </h3>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 14px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; width: 40%;">Worker Name:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${workerName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Payroll Period:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${cutoffLabel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Cutoff Dates:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${dateRange}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Status:</td>
                    <td style="padding: 6px 0; color: #059669; font-weight: 700;">Approved (Awaiting Upload)</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Approved On:</td>
                    <td style="padding: 6px 0; color: #0f172a;">${displayDate}</td>
                  </tr>
                </table>
              </div>

              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Thank you for your patience and dedication to ApexScript Solutions. If you have questions regarding your request, please reach out to the management team.
              </p>

              <p style="margin: 0; font-size: 14px; color: #334155;">
                Warm regards,<br>
                <strong style="color: #0f172a;">ApexScript Administrative Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
                This is an automated notification from the <strong>ApexScript Worker Portal</strong>. Please do not reply directly to this email.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                CONFIDENTIALITY NOTICE: This transmission is intended solely for the recipient named above and contains confidential information. If you received this in error, please disregard and notify the sender immediately.
              </p>
              <p style="margin: 12px 0 0 0; font-size: 11px; color: #94a3b8;">
                &copy; ${currentYear} ApexScript Solutions. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export function buildPayslipUploadedEmailHtml({
  workerName,
  cutoffLabel,
  dateRange,
  payslipUrl,
  uploadedAt,
}: {
  workerName: string
  cutoffLabel: string
  dateRange: string
  payslipUrl: string
  uploadedAt?: string
}): string {
  const currentYear = new Date().getFullYear()
  const displayDate = uploadedAt || new Date().toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip Ready for Download</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 32px; border-bottom: 3px solid #2563eb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #ffffff; font-size: 19px; font-weight: 700; letter-spacing: 0.5px;">APEXSCRIPT SOLUTIONS</h1>
                    <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Worker Portal &bull; Payroll Administration</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              <!-- Status Badge -->
              <div style="margin-bottom: 20px;">
                <span style="display: inline-block; background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                  &#128196; Document Ready &bull; Available for Download
                </span>
              </div>

              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 22px; font-weight: 700; line-height: 1.3;">
                Your Payslip Is Now Available
              </h2>

              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                Dear <strong>${workerName}</strong>,
              </p>

              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                Following up on your approved payslip request, your official payslip for <strong>${cutoffLabel}</strong> has been uploaded by the administrative team and is now available for download.
              </p>

              <!-- Primary Action Button -->
              <div style="text-align: center; margin: 28px 0;">
                <a href="${payslipUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);">
                  &#128229; Download Payslip (PDF)
                </a>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">
                  Click the button above to securely open and download your payslip file.
                </p>
              </div>

              <!-- Payslip Details Summary Card -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 14px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; font-weight: 700;">
                  Document Details
                </h3>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size: 14px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; width: 40%;">Worker Name:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${workerName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Payroll Period:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${cutoffLabel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Cutoff Dates:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${dateRange}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Document Status:</td>
                    <td style="padding: 6px 0; color: #2563eb; font-weight: 700;">Uploaded &amp; Available</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Uploaded On:</td>
                    <td style="padding: 6px 0; color: #0f172a;">${displayDate}</td>
                  </tr>
                </table>
              </div>

              <!-- How to access via portal box -->
              <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #1e293b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                  &#128187; Accessing via the Worker Portal
                </h4>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.7;">
                  <li>Log in to the <strong>ApexScript Worker Portal</strong>.</li>
                  <li>Click on the <strong>"Request Payslip"</strong> card on your dashboard.</li>
                  <li>Select the <strong>"View Status"</strong> tab.</li>
                  <li>Find your entry for <strong>${cutoffLabel}</strong> and click <strong>"Download payslip"</strong>.</li>
                </ol>
              </div>

              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Please ensure you store your payslip in a safe and secure location. If you encounter any discrepancies, please reach out to administration immediately.
              </p>

              <p style="margin: 0; font-size: 14px; color: #334155;">
                Warm regards,<br>
                <strong style="color: #0f172a;">ApexScript Administrative Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
                This is an automated notification from the <strong>ApexScript Worker Portal</strong>. Please do not reply directly to this email.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                CONFIDENTIALITY NOTICE: This transmission is intended solely for the recipient named above and contains confidential payroll information.
              </p>
              <p style="margin: 12px 0 0 0; font-size: 11px; color: #94a3b8;">
                &copy; ${currentYear} ApexScript Solutions. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
