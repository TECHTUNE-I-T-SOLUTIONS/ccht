import nodemailer from 'nodemailer'

export type EmailProvider = 'gmail' | 'namecheap' | 'zoho' | 'custom'

export interface EmailConfig {
  provider: EmailProvider
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  fromName: string
  fromEmail: string
}

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

class EmailService {
  private static instance: EmailService
  private transporter: nodemailer.Transporter | null = null
  private config: EmailConfig | null = null

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  private getConfig(): EmailConfig {
    if (this.config) return this.config

    const provider = (process.env.EMAIL_PROVIDER || 'gmail') as EmailProvider
    const fromName = process.env.EMAIL_FROM_NAME || 'CCHT School'
    const fromEmail = process.env.EMAIL_FROM_EMAIL || 'cchtschool206@gmail.com'

    let config: EmailConfig

    switch (provider) {
      case 'gmail':
        config = {
          provider: 'gmail',
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: fromEmail,
            pass: process.env.GMAIL_APP_PASSWORD || '',
          },
          fromName,
          fromEmail,
        }
        break

      case 'namecheap':
        config = {
          provider: 'namecheap',
          host: process.env.EMAIL_HOST || 'smtp.privateemail.com',
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: fromEmail,
            pass: process.env.EMAIL_PASSWORD || '',
          },
          fromName,
          fromEmail,
        }
        break

      case 'zoho':
        config = {
          provider: 'zoho',
          host: process.env.EMAIL_HOST || 'smtp.zoho.com',
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: fromEmail,
            pass: process.env.EMAIL_PASSWORD || '',
          },
          fromName,
          fromEmail,
        }
        break

      case 'custom':
      default:
        config = {
          provider: 'custom',
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: fromEmail,
            pass: process.env.EMAIL_PASSWORD || '',
          },
          fromName,
          fromEmail,
        }
        break
    }

    this.config = config
    return config
  }

  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) return this.transporter

    const config = this.getConfig()
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    })

    return this.transporter
  }

  private getBaseTemplate(content: string, title: string): string {
    const schoolLogo = 'https://www.covenantcollegeofhealthtech.com.ng/_next/image?url=%2Fimages%2Flogo.png&w=48&q=75'
    const schoolName = 'CCHT'
    const schoolFullName = 'Covenant College of Health Technology'
    const schoolWebsite = 'https://www.covenantcollegeofhealthtech.com.ng'
    const schoolAddress = 'Igbon, Oyo State, Nigeria'
    const schoolPhone = '+2347066369818'
    const schoolEmail = 'info@covenantcollegeofhealthtech.com.ng'

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>${title}</title>
        <!--[if mso]>
        <style type="text/css">
          body { font-family: Arial, sans-serif !important; }
        </style>
        <![endif]-->
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f7fa;
            padding: 0;
            margin: 0;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
          }
          .email-wrapper {
            width: 100%;
            background: #f5f7fa;
            padding: 20px 0;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          }
          .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #2563eb 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
          }
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('${schoolLogo}') no-repeat center top;
            background-size: 120px 120px;
            opacity: 0.1;
            background-position: center 20px;
          }
          .header-content {
            position: relative;
            z-index: 1;
          }
          .header img {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 4px solid rgba(255,255,255,0.3);
            margin-bottom: 20px;
            display: block;
            margin-left: auto;
            margin-right: auto;
          }
          .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          .header .subtitle {
            font-size: 16px;
            opacity: 0.95;
            font-weight: 400;
          }
          .header .tagline {
            font-size: 13px;
            opacity: 0.85;
            margin-top: 8px;
            font-style: italic;
          }
          .content {
            padding: 40px 30px;
            color: #333;
          }
          .greeting {
            font-size: 20px;
            color: #1e40af;
            margin-bottom: 20px;
            font-weight: 600;
          }
          .message {
            color: #555;
            margin-bottom: 20px;
            font-size: 15px;
            line-height: 1.8;
          }
          .info-box {
            background: #f8fafc;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          }
          .info-box h3 {
            color: #1e40af;
            margin-bottom: 12px;
            font-size: 18px;
            font-weight: 600;
          }
          .info-box ul {
            list-style: none;
            padding: 0;
          }
          .info-box li {
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-box li:last-child {
            border-bottom: none;
          }
          .info-box strong {
            color: #1e40af;
            font-weight: 600;
            display: inline-block;
            min-width: 140px;
          }
          .button {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: 600;
            font-size: 15px;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            transition: all 0.3s ease;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
          }
          .footer {
            background: #1e40af;
            color: white;
            padding: 30px;
            text-align: center;
          }
          .footer-content {
            max-width: 600px;
            margin: 0 auto;
          }
          .footer p {
            margin: 8px 0;
            font-size: 13px;
            opacity: 0.9;
          }
          .footer a {
            color: #ffffff;
            text-decoration: none;
            font-weight: 500;
            margin: 0 8px;
          }
          .footer a:hover {
            text-decoration: underline;
            opacity: 0.8;
          }
          .footer-divider {
            height: 1px;
            background: rgba(255,255,255,0.2);
            margin: 15px 0;
          }
          .highlight {
            background: #fef3c7;
            padding: 3px 10px;
            border-radius: 4px;
            font-weight: 600;
            color: #92400e;
          }
          .success {
            color: #059669;
            font-weight: 600;
          }
          .warning {
            color: #d97706;
            font-weight: 600;
          }
          .danger {
            color: #dc2626;
            font-weight: 600;
          }
          .divider {
            height: 1px;
            background: #e5e7eb;
            margin: 25px 0;
          }
          @media only screen and (max-width: 600px) {
            .header { padding: 30px 20px; }
            .content { padding: 30px 20px; }
            .footer { padding: 20px; }
            .header h1 { font-size: 24px; }
            .header img { width: 80px; height: 80px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <div class="header">
              <div class="header-content">
                <img src="${schoolLogo}" alt="${schoolFullName}">
                <h1>${schoolFullName}</h1>
                <p class="subtitle">${schoolName}</p>
                <p class="tagline">Excellence in Health Technology Education</p>
              </div>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <div class="footer-content">
                <p style="font-weight: 600; font-size: 14px; margin-bottom: 10px;">${schoolFullName}</p>
                <p>${schoolAddress}</p>
                <p>Phone: <a href="tel:${schoolPhone}">${schoolPhone}</a> | Email: <a href="mailto:${schoolEmail}">${schoolEmail}</a></p>
                <div class="footer-divider"></div>
                <p style="font-size: 12px; opacity: 0.8;">
                  <a href="${schoolWebsite}">Visit Website</a> | 
                  <a href="${schoolWebsite}/portal/login">Portal Login</a> | 
                  <a href="mailto:${schoolEmail}">Contact Us</a>
                </p>
                <p style="margin-top: 10px; font-size: 11px; opacity: 0.7;">
                  &copy; ${new Date().getFullYear()} ${schoolFullName}. All rights reserved.
                </p>
                <p style="margin-top: 5px; font-size: 10px; opacity: 0.6;">
                  This is an automated message. Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }

  async sendEmail(template: EmailTemplate): Promise<boolean> {
    const maxRetries = 3
    const retryDelay = 60000 // 1 minute in milliseconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const config = this.getConfig()
        const transporter = this.getTransporter()

        const mailOptions = {
          from: `${config.fromName} <${config.fromEmail}>`,
          to: template.to,
          subject: template.subject,
          html: template.html,
          attachments: template.attachments,
        }

        const info = await transporter.sendMail(mailOptions)
        console.log('Email sent successfully:', info.messageId)
        return true
      } catch (error) {
        console.error(`Failed to send email (attempt ${attempt}/${maxRetries}):`, error)
        
        if (attempt < maxRetries) {
          console.log(`Retrying in ${retryDelay / 1000} seconds...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        } else {
          console.error('Max retries reached. Email sending failed.')
          return false
        }
      }
    }
    return false
  }

  // Helper method to send email asynchronously (fire and forget)
  async sendEmailAsync(template: EmailTemplate): Promise<void> {
    // Send email without waiting for result
    this.sendEmail(template).catch((error) => {
      console.error('Async email send failed:', error)
    })
  }

  // Verify email configuration
  async verifyConnection(): Promise<boolean> {
    try {
      const transporter = this.getTransporter()
      await transporter.verify()
      console.log('Email service connection verified')
      return true
    } catch (error) {
      console.error('Email service connection failed:', error)
      return false
    }
  }
}

export const emailService = EmailService.getInstance()