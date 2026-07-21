// Email Design Options for Assignment Comments
// Choose one of these designs to use in the route.ts file

export function getDesignOption1(workerName: string, filename: string | undefined, comment: string, adminName: string): string {
  // Modern Minimalist with Blue Accent
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Assignment Feedback</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f8fafc;
        }
        .email-wrapper {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          padding: 40px;
          text-align: center;
        }
        .logo {
          font-size: 26px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }
        .header-subtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .content {
          padding: 40px;
        }
        .greeting {
          font-size: 22px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 16px;
        }
        .intro-text {
          font-size: 15px;
          color: #64748b;
          margin-bottom: 28px;
          line-height: 1.7;
        }
        .comment-box {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 28px;
          margin: 28px 0;
        }
        .filename-section {
          background: #dbeafe;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 16px;
          border-left: 3px solid #3b82f6;
        }
        .filename-label {
          font-size: 10px;
          font-weight: 700;
          color: #1e40af;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        .filename-value {
          font-size: 14px;
          font-weight: 600;
          color: #1e3a8a;
        }
        .comment-text {
          font-size: 15px;
          color: #1e293b;
          line-height: 1.7;
          white-space: pre-wrap;
        }
        .divider {
          height: 1px;
          background: #e2e8f0;
          margin: 32px 0;
        }
        .footer {
          text-align: center;
          padding: 28px 40px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
        .footer-text {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 6px;
        }
        .admin-name {
          font-weight: 600;
          color: #1e293b;
        }
        .company-name {
          font-weight: 600;
          color: #3b82f6;
        }
        .disclaimer {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 12px;
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

          <div class="comment-box">
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
          <p class="disclaimer">Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function getDesignOption2(workerName: string, filename: string | undefined, comment: string, adminName: string): string {
  // Professional Corporate Navy
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Assignment Feedback</title>
      <style>
        body {
          font-family: 'Georgia', 'Times New Roman', serif;
          line-height: 1.7;
          color: #2c3e50;
          margin: 0;
          padding: 0;
          background-color: #ecf0f1;
        }
        .email-wrapper {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border: 1px solid #bdc3c7;
          overflow: hidden;
        }
        .header {
          background: #2c3e50;
          padding: 35px 40px;
          border-bottom: 4px solid #34495e;
        }
        .logo {
          font-size: 22px;
          font-weight: 700;
          color: #ecf0f1;
          letter-spacing: 1px;
          margin-bottom: 6px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .header-subtitle {
          font-size: 11px;
          color: #95a5a6;
          font-weight: 500;
          letter-spacing: 3px;
          text-transform: uppercase;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .content {
          padding: 40px;
        }
        .greeting {
          font-size: 20px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 20px;
        }
        .intro-text {
          font-size: 15px;
          color: #546e7a;
          margin-bottom: 24px;
          line-height: 1.8;
        }
        .comment-section {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          padding: 30px;
          margin: 24px 0;
          position: relative;
        }
        .comment-section::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: #2c3e50;
        }
        .filename-section {
          background: #e9ecef;
          padding: 14px 18px;
          margin-bottom: 18px;
          border-radius: 2px;
        }
        .filename-label {
          font-size: 10px;
          font-weight: 700;
          color: #495057;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 6px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .filename-value {
          font-size: 15px;
          font-weight: 600;
          color: #212529;
        }
        .comment-text {
          font-size: 15px;
          color: #34495e;
          line-height: 1.8;
          white-space: pre-wrap;
          font-style: italic;
        }
        .divider {
          height: 1px;
          background: #dee2e6;
          margin: 28px 0;
        }
        .footer {
          text-align: center;
          padding: 24px 40px;
          background: #f8f9fa;
          border-top: 1px solid #dee2e6;
        }
        .footer-text {
          font-size: 13px;
          color: #6c757d;
          margin-bottom: 6px;
        }
        .admin-name {
          font-weight: 600;
          color: #2c3e50;
        }
        .company-name {
          font-weight: 600;
          color: #495057;
        }
        .disclaimer {
          font-size: 11px;
          color: #adb5bd;
          margin-top: 14px;
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

          <div class="comment-section">
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
          <p class="disclaimer">Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function getDesignOption3(workerName: string, filename: string | undefined, comment: string, adminName: string): string {
  // Clean Elegant with Subtle Gradients
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Assignment Feedback</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #374151;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .email-wrapper {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        .header {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 36px 40px;
          text-align: center;
          border-bottom: 1px solid #e5e7eb;
        }
        .logo {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          letter-spacing: -0.3px;
          margin-bottom: 6px;
        }
        .header-subtitle {
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .content {
          padding: 40px;
        }
        .greeting {
          font-size: 21px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 18px;
        }
        .intro-text {
          font-size: 15px;
          color: #4b5563;
          margin-bottom: 26px;
          line-height: 1.7;
        }
        .comment-card {
          background: linear-gradient(135deg, #fafbfc 0%, #f3f4f6 100%);
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 32px;
          margin: 26px 0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .filename-section {
          background: #ffffff;
          padding: 16px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .filename-label {
          font-size: 10px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 6px;
        }
        .filename-value {
          font-size: 15px;
          font-weight: 600;
          color: #1f2937;
        }
        .comment-text {
          font-size: 15px;
          color: #374151;
          line-height: 1.8;
          white-space: pre-wrap;
        }
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
          margin: 30px 0;
        }
        .footer {
          text-align: center;
          padding: 30px 40px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }
        .footer-text {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 6px;
        }
        .admin-name {
          font-weight: 600;
          color: #1f2937;
        }
        .company-name {
          font-weight: 600;
          color: #4b5563;
        }
        .disclaimer {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 14px;
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
          <p class="disclaimer">Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function getDesignOption4(workerName: string, filename: string | undefined, comment: string, adminName: string): string {
  // Bold Dark Theme
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Assignment Feedback</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #e5e7eb;
          margin: 0;
          padding: 0;
          background-color: #0f172a;
        }
        .email-wrapper {
          max-width: 600px;
          margin: 40px auto;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .header {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          padding: 36px 40px;
          text-align: center;
          border-bottom: 2px solid #334155;
        }
        .logo {
          font-size: 24px;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.3px;
          margin-bottom: 6px;
        }
        .header-subtitle {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .content {
          padding: 40px;
        }
        .greeting {
          font-size: 21px;
          font-weight: 600;
          color: #f1f5f9;
          margin-bottom: 18px;
        }
        .intro-text {
          font-size: 15px;
          color: #cbd5e1;
          margin-bottom: 26px;
          line-height: 1.7;
        }
        .comment-card {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 28px;
          margin: 26px 0;
        }
        .filename-section {
          background: #1e293b;
          padding: 16px 20px;
          border-radius: 6px;
          margin-bottom: 18px;
          border-left: 3px solid #38bdf8;
        }
        .filename-label {
          font-size: 10px;
          font-weight: 700;
          color: #38bdf8;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 6px;
        }
        .filename-value {
          font-size: 15px;
          font-weight: 600;
          color: #f1f5f9;
        }
        .comment-text {
          font-size: 15px;
          color: #e2e8f0;
          line-height: 1.8;
          white-space: pre-wrap;
        }
        .divider {
          height: 1px;
          background: #334155;
          margin: 30px 0;
        }
        .footer {
          text-align: center;
          padding: 20px 40px;
          background: #0f172a;
          border-top: 1px solid #334155;
        }
        .disclaimer {
          font-size: 11px;
          color: #64748b;
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
          <p class="disclaimer">Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
