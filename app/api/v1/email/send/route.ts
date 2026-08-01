import { NextResponse } from 'next/server'
import { emailService } from '@/lib/services/email.service'
import { EmailTemplates, wrapEmailContent } from '@/lib/services/email-templates'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, subject, html, attachments, template, templateData } = body

    let emailTemplate

    if (template && templateData) {
      // Use predefined template
      switch (template) {
        case 'aspirant.application_received':
          emailTemplate = EmailTemplates.aspirantApplicationReceived(templateData)
          break
        case 'aspirant.status_update':
          emailTemplate = EmailTemplates.aspirantStatusUpdate(templateData)
          break
        case 'aspirant.document_update':
          emailTemplate = EmailTemplates.aspirantDocumentUpdate(templateData)
          break
        case 'aspirant.payment_receipt':
          emailTemplate = EmailTemplates.aspirantPaymentReceipt(templateData)
          break
        case 'aspirant.admitted':
          emailTemplate = EmailTemplates.aspirantAdmitted(templateData)
          break
        case 'aspirant.migrated_to_student':
          emailTemplate = EmailTemplates.aspirantMigratedToStudent(templateData)
          break
        case 'student.welcome':
          emailTemplate = EmailTemplates.studentWelcome(templateData)
          break
        case 'student.result_published':
          emailTemplate = EmailTemplates.studentResultPublished(templateData)
          break
        case 'student.course_registration':
          emailTemplate = EmailTemplates.studentCourseRegistration(templateData)
          break
        case 'student.fee_notification':
          emailTemplate = EmailTemplates.studentFeeNotification(templateData)
          break
        case 'student.password_reset':
          emailTemplate = EmailTemplates.studentPasswordReset(templateData)
          break
        case 'lecturer.welcome':
          emailTemplate = EmailTemplates.lecturerWelcome(templateData)
          break
        case 'lecturer.password_reset':
          emailTemplate = EmailTemplates.lecturerPasswordReset(templateData)
          break
        case 'admin.welcome':
          emailTemplate = EmailTemplates.adminWelcome(templateData)
          break
        case 'admin.password_reset':
          emailTemplate = EmailTemplates.adminPasswordReset(templateData)
          break
        case 'admin.new_user_notification':
          emailTemplate = EmailTemplates.adminNewUserNotification(templateData)
          break
        case 'announcement':
          emailTemplate = EmailTemplates.announcement(templateData)
          break
        case 'event_notification':
          emailTemplate = EmailTemplates.eventNotification(templateData)
          break
        default:
          return NextResponse.json({ error: 'Invalid template' }, { status: 400 })
      }
    } else if (to && (subject || html)) {
      // Use custom email - check if already wrapped, if not wrap with professional template
      const customContent = html || '<p>No message content</p>'
      // Check if content is already wrapped (contains the email wrapper class)
      const isAlreadyWrapped = customContent.includes('email-wrapper')
      const wrappedHtml = isAlreadyWrapped ? customContent : wrapEmailContent(customContent, subject || 'Email from CCHT')
      
      emailTemplate = {
        to,
        subject: subject || 'No Subject',
        html: wrappedHtml,
        attachments,
      }
    } else {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Send email asynchronously (fire and forget)
    emailService.sendEmailAsync(emailTemplate)

    return NextResponse.json(
      { success: true, message: 'Email queued for sending' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Verify email configuration
    const isConnected = await emailService.verifyConnection()
    return NextResponse.json({
      status: isConnected ? 'connected' : 'disconnected',
      message: isConnected ? 'Email service is configured correctly' : 'Email service is not configured',
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to verify email configuration' },
      { status: 500 }
    )
  }
}