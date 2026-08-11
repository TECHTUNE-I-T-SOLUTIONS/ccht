import { EmailTemplate } from './email.service'

const schoolLogo = 'https://www.covenantcollegeofhealthtech.com.ng/_next/image?url=%2Fimages%2Flogo.png&w=48&q=75'
const schoolName = 'CCHT'
const schoolFullName = 'Covenant College of Health Technology'
const schoolWebsite = 'https://www.covenantcollegeofhealthtech.com.ng'
const portalUrl = `${schoolWebsite}/login`
const schoolAddress = 'Igbon, Oyo State, Nigeria'
const schoolPhone = '+2347066369818'
const schoolEmail = 'info@covenantcollegeofhealthtech.com.ng'

// Helper function to wrap content with the professional email template
export function wrapEmailContent(content: string, title: string): string {
  const schoolLogo = 'https://www.covenantcollegeofhealthtech.com.ng/_next/image?url=%2Fimages%2Flogo.png&w=48&q=75'
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
          background: linear-gradient(135deg, #405390 0%, #4A638A 50%, #3E5077 100%);
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
          background: linear-gradient(135deg, #767A87 0%, #7C8797 100%);
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
                <a href="${schoolWebsite}/login">Portal Login</a> | 
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

export class EmailTemplates {
  // ==================== ASPIRANT EMAILS ====================

  static aspirantApplicationReceived(data: {
    email: string
    fullName: string
    applicationId: string
    program: string
  }): EmailTemplate {
    const content = `
      <div class="greeting">Dear ${data.fullName},</div>
        <div class="message">
          Thank you for your interest in <strong>${schoolFullName}</strong>. We are pleased to inform you that your application has been <span class="success">received successfully</span> and is now being processed by our admissions team.
        </div>
        <div class="info-box">
          <h3>📋 Application Details</h3>
          <ul>
            <li><strong>Application ID:</strong> <span class="highlight">${data.applicationId}</span></li>
            <li><strong>Program Applied:</strong> ${data.program}</li>
            <li><strong>Application Status:</strong> <span class="highlight">Under Review</span></li>
            <li><strong>Submission Date:</strong> ${new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</li>
          </ul>
        </div>
        <div class="message">
          <strong>📝 What happens next?</strong>
          <ol style="margin-top: 10px; padding-left: 20px; line-height: 2;">
            <li>Our admissions team will carefully review your application and documents</li>
            <li>You will receive email notifications for any updates or actions required</li>
            <li>Once reviewed, you'll be notified of the decision</li>
            <li>If admitted, you'll receive your admission letter and next steps</li>
          </ol>
        </div>
        <div class="info-box">
          <h3>📌 Important Information</h3>
          <ul>
            <li><strong>Portal:</strong> You can track your application status at <a href="${portalUrl}">${portalUrl}</a></li>
            <li><strong>Email:</strong> Please check your email regularly for updates</li>
            <li><strong>Documents:</strong> Ensure all required documents are uploaded</li>
            <li><strong>Contact:</strong> For inquiries, email us at <a href="mailto:${schoolEmail}">${schoolEmail}</a> or call ${schoolPhone}</li>
          </ul>
        </div>
        <div class="message">
          <a href="${portalUrl}" class="button">Access Application Portal</a>
        </div>
        <div class="message">
          We look forward to reviewing your application and welcoming you to ${schoolFullName}.
        </div>
        <div class="message">
          Best regards,<br>
          <strong>Admissions Office</strong><br>
          ${schoolFullName}<br>
          ${schoolAddress}<br>
          Email: <a href="mailto:${schoolEmail}">${schoolEmail}</a> | Phone: ${schoolPhone}
        </div>
      `

    return {
      to: data.email,
      subject: 'Application Received - CCHT Admission',
      html: wrapEmailContent(content, 'Application Received - CCHT Admission'),
    }
  }

  static aspirantStatusUpdate(data: {
    email: string
    fullName: string
    status: string
    message: string
    applicationId: string
  }): EmailTemplate {
    const content = `
      <div class="greeting">Dear ${data.fullName},</div>
        <div class="message">
          We are writing to inform you that your application status has been <span class="highlight">updated</span>. Please review the details below carefully.
        </div>
        <div class="info-box">
          <h3>📊 Status Update Details</h3>
          <ul>
            <li><strong>Application ID:</strong> ${data.applicationId}</li>
            <li><strong>New Status:</strong> <span class="highlight">${data.status}</span></li>
            <li><strong>Update Date:</strong> ${new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</li>
            <li><strong>Message:</strong> ${data.message}</li>
          </ul>
        </div>
        <div class="message">
          <strong>📝 What you need to do:</strong>
          <ol style="margin-top: 10px; padding-left: 20px; line-height: 2;">
            <li>Log in to your application portal</li>
            <li>Review the updated status and any requirements</li>
            <li>Complete any pending actions if required</li>
            <li>Upload any additional documents if requested</li>
          </ol>
        </div>
        <div class="info-box">
          <h3>📌 Need Help?</h3>
          <ul>
            <li><strong>Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></li>
            <li><strong>Email:</strong> <a href="mailto:${schoolEmail}">${schoolEmail}</a></li>
            <li><strong>Phone:</strong> ${schoolPhone}</li>
            <li><strong>Address:</strong> ${schoolAddress}</li>
          </ul>
        </div>
        <div class="message">
          <a href="${portalUrl}" class="button">View Application Status</a>
        </div>
        <div class="message">
          Best regards,<br>
          <strong>Admissions Office</strong><br>
          ${schoolFullName}<br>
          ${schoolAddress}<br>
          Email: <a href="mailto:${schoolEmail}">${schoolEmail}</a> | Phone: ${schoolPhone}
        </div>
      `

    return {
      to: data.email,
      subject: `Application Status Update - ${data.status}`,
      html: wrapEmailContent(content, `Application Status Update - ${data.status}`),
    }
  }

  static aspirantDocumentUpdate(data: {
    email: string
    fullName: string
    documentType: string
    status: string
    message?: string
    applicationId: string
  }): EmailTemplate {
    const content = `
      <div class="greeting">Dear ${data.fullName},</div>
        <div class="message">
          We are pleased to inform you that your submitted document has been <span class="${data.status === 'Approved' ? 'success' : 'warning'}">${data.status}</span>. Here are the details:
        </div>
        <div class="info-box">
          <h3>📄 Document Review Details</h3>
          <ul>
            <li><strong>Application ID:</strong> ${data.applicationId}</li>
            <li><strong>Document Type:</strong> ${data.documentType}</li>
            <li><strong>Review Status:</strong> <span class="${data.status === 'Approved' ? 'success' : 'warning'}">${data.status}</span></li>
            <li><strong>Review Date:</strong> ${new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</li>
            ${data.message ? `<li><strong>Reviewer's Note:</strong> ${data.message}</li>` : ''}
          </ul>
        </div>
        <div class="message">
          <strong>📝 Next Steps:</strong>
          <ol style="margin-top: 10px; padding-left: 20px; line-height: 2;">
            <li>Log in to your application portal</li>
            <li>Review the document status and any feedback</li>
            <li>Upload additional documents if required</li>
            <li>Wait for further updates on your application</li>
          </ol>
        </div>
        <div class="info-box">
          <h3>📌 Important Links</h3>
          <ul>
            <li><strong>Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></li>
            <li><strong>Email:</strong> <a href="mailto:${schoolEmail}">${schoolEmail}</a></li>
            <li><strong>Phone:</strong> ${schoolPhone}</li>
          </ul>
        </div>
        <div class="message">
          <a href="${portalUrl}" class="button">View Application Portal</a>
        </div>
        <div class="message">
          Best regards,<br>
          <strong>Admissions Office</strong><br>
          ${schoolFullName}<br>
          ${schoolAddress}<br>
          Email: <a href="mailto:${schoolEmail}">${schoolEmail}</a> | Phone: ${schoolPhone}
        </div>
      `

    return {
      to: data.email,
      subject: `Document ${data.status} - ${data.documentType}`,
      html: wrapEmailContent(content, `Document ${data.status} - ${data.documentType}`),
    }
  }

  static aspirantPaymentReceipt(data: {
    email: string
    fullName: string
    amount: number
    paymentReference: string
    paymentDate: string
    receiptUrl?: string
    applicationId?: string
  }): EmailTemplate {
    const content = `
      <div class="greeting">Dear ${data.fullName},</div>
        <div class="message">
          <strong>Payment Confirmed!</strong> We are pleased to confirm that your payment has been <span class="success">processed successfully</span>. Thank you for your prompt payment.
        </div>
        <div class="info-box">
          <h3>💳 Payment Receipt Details</h3>
          <ul>
            ${data.applicationId ? `<li><strong>Application ID:</strong> ${data.applicationId}</li>` : ''}
            <li><strong>Amount Paid:</strong> <span class="highlight">₦${data.amount.toLocaleString()}</span></li>
            <li><strong>Payment Reference:</strong> ${data.paymentReference}</li>
            <li><strong>Payment Date:</strong> ${data.paymentDate}</li>
            <li><strong>Payment Status:</strong> <span class="success">✓ Paid</span></li>
          </ul>
        </div>
        <div class="message">
          <strong>📋 Important Information:</strong>
          <ul style="margin-top: 10px; padding-left: 20px; line-height: 2;">
            <li>Please keep this receipt for your records</li>
            <li>This payment has been credited to your account</li>
            <li>You can download the official receipt using the button below</li>
            <li>Present this receipt if required during registration</li>
          </ul>
        </div>
        ${data.receiptUrl ? `
          <div class="message">
            <a href="${data.receiptUrl}" class="button">📥 Download Official Receipt</a>
          </div>
        ` : ''}
        <div class="info-box">
          <h3>📌 Need Assistance?</h3>
          <ul>
            <li><strong>Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></li>
            <li><strong>Email:</strong> <a href="mailto:${schoolEmail}">${schoolEmail}</a></li>
            <li><strong>Phone:</strong> ${schoolPhone}</li>
            <li><strong>Address:</strong> ${schoolAddress}</li>
          </ul>
        </div>
        <div class="message">
          Best regards,<br>
          <strong>Finance Office</strong><br>
          ${schoolFullName}<br>
          ${schoolAddress}<br>
          Email: <a href="mailto:${schoolEmail}">${schoolEmail}</a> | Phone: ${schoolPhone}
        </div>
      `

    return {
      to: data.email,
      subject: 'Payment Receipt - CCHT',
      html: wrapEmailContent(content, 'Payment Receipt - CCHT'),
    }
  }

  static aspirantAdmitted(data: {
    email: string
    fullName: string
    program: string
    matricNumber: string
    admissionLetterUrl?: string
    oathFormUrl?: string
    applicationId?: string
  }): EmailTemplate {
    const content = `
        <div class="greeting">Dear ${data.fullName},</div>
        <div class="message">
          <strong>🎓 Congratulations!</strong> We are absolutely thrilled to inform you that you have been <span class="success">offered admission</span> into <strong>${schoolFullName}</strong>. This is a significant achievement, and we celebrate your success!
        </div>
        <div class="info-box">
          <h3>🎊 Admission Details</h3>
          <ul>
            ${data.applicationId ? `<li><strong>Application ID:</strong> ${data.applicationId}</li>` : ''}
            <li><strong>Program:</strong> ${data.program}</li>
            <li><strong>Matric Number:</strong> <span class="highlight">${data.matricNumber}</span></li>
            <li><strong>Academic Session:</strong> ${new Date().getFullYear()}/${new Date().getFullYear() + 1}</li>
            <li><strong>Status:</strong> <span class="success">✓ Admitted</span></li>
          </ul>
        </div>
        <div class="message">
          <strong>📋 Important Next Steps:</strong>
          <ol style="margin-top: 10px; padding-left: 20px; line-height: 2;">
            <li>Download and carefully review your admission letter</li>
            <li>Complete the online registration process in the student portal</li>
            <li>Make payment for your school fees and accommodation (if applicable)</li>
            <li>Attend the mandatory orientation program for new students</li>
            <li>Visit the campus for your first day of classes</li>
          </ol>
        </div>
        <div class="info-box">
          <h3>📌 Essential Information</h3>
          <ul>
            <li><strong>Portal:</strong> Access the student portal at <a href="${portalUrl}">${portalUrl}</a></li>
            <li><strong>Email:</strong> All official communications will be sent to your registered email</li>
            <li><strong>Contact:</strong> For inquiries, email <a href="mailto:${schoolEmail}">${schoolEmail}</a> or call ${schoolPhone}</li>
            <li><strong>Address:</strong> ${schoolAddress}</li>
          </ul>
        </div>
        ${data.admissionLetterUrl ? `
          <div class="message">
            <a href="${data.admissionLetterUrl}" class="button">📄 Download Admission Letter</a>
          </div>
        ` : ''}
        ${data.oathFormUrl ? `
          <div class="message">
            <a href="${data.oathFormUrl}" class="button">📝 Download Oath Form</a>
          </div>
        ` : ''}
        <div class="message">
          <strong>Welcome to ${schoolFullName}!</strong> We are excited to have you join our community of future health technology professionals. Your journey to excellence starts here.
        </div>
        <div class="message">
          Best regards,<br>
          <strong>Admissions Office</strong><br>
          ${schoolFullName}<br>
          ${schoolAddress}<br>
          Email: <a href="mailto:${schoolEmail}">${schoolEmail}</a> | Phone: ${schoolPhone}
        </div>
      `

    return {
      to: data.email,
      subject: '🎉 Congratulations! You Have Been Admitted - CCHT',
      html: wrapEmailContent(content, 'Congratulations! You Have Been Admitted - CCHT'),
    }
  }

  static aspirantMigratedToStudent(data: {
    email: string
    fullName: string
    matricNumber: string
    password: string
    program: string
    department: string
    applicationId?: string
  }): EmailTemplate {
    const content = `
        <div class="greeting">Dear ${data.fullName},</div>
        <div class="message">
          <strong>🎉 Congratulations!</strong> Your journey as a student at <strong>${schoolFullName}</strong> has officially begun! Your application has been <span class="success">successfully processed</span>, and you have been migrated to student status.
        </div>
        <div class="info-box">
          <h3>🎊 Your Student Information</h3>
          <ul>
            ${data.applicationId ? `<li><strong>Application ID:</strong> ${data.applicationId}</li>` : ''}
            <li><strong>Matric Number:</strong> <span class="highlight">${data.matricNumber}</span></li>
            <li><strong>Email:</strong> ${data.email}</li>
            <li><strong>Login:</strong> Use your existing password</li>
            <li><strong>Program:</strong> ${data.program}</li>
            <li><strong>Department:</strong> ${data.department}</li>
          </ul>
        </div>
        <div class="message">
          <strong>🔐 Important Login Information:</strong>
          <ul style="margin-top: 10px; padding-left: 20px; line-height: 2;">
            <li>Your existing account has been upgraded to student status</li>
            <li>Use your current email and password to log in</li>
            <li>You will now have access to all student portal features</li>
            <li>Consider updating your password for security</li>
            <li>Never share your login credentials with anyone</li>
          </ul>
        </div>
        <div class="info-box">
          <h3>📌 Important Links & Contacts</h3>
          <ul>
            <li><strong>Student Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></li>
            <li><strong>Email:</strong> <a href="mailto:${schoolEmail}">${schoolEmail}</a></li>
            <li><strong>Phone:</strong> ${schoolPhone}</li>
            <li><strong>Address:</strong> ${schoolAddress}</li>
          </ul>
        </div>
        <div class="message">
          <strong>What's Next?</strong>
          <ol style="margin-top: 10px; padding-left: 20px; line-height: 2;">
            <li>Log in to the student portal using your existing credentials</li>
            <li>Review your student profile information</li>
            <li>Register for your courses for the upcoming semester</li>
            <li>Check your timetable and academic calendar</li>
            <li>Make payment for your fees</li>
            <li>Attend orientation program</li>
          </ol>
        </div>
        <div class="message">
          <a href="${portalUrl}" class="button">🚀 Access Student Portal</a>
        </div>
        <div class="message">
          <strong>Welcome to ${schoolFullName}!</strong> We are committed to providing you with quality education and a memorable learning experience. Your future in health technology starts now!
        </div>
        <div class="message">
          If you encounter any issues or have questions, please contact the IT Help Desk at 
          <a href="mailto:${schoolEmail}">${schoolEmail}</a> or call ${schoolPhone}.
        </div>
        <div class="message">
          Best regards,<br>
          <strong>Student Affairs Office</strong><br>
          ${schoolFullName}<br>
          ${schoolAddress}<br>
          Email: <a href="mailto:${schoolEmail}">${schoolEmail}</a> | Phone: ${schoolPhone}
        </div>
      `

    return {
      to: data.email,
      subject: '🎓 Welcome to CCHT - Your Student Account Has Been Created',
      html: wrapEmailContent(content, 'Welcome to CCHT - Your Student Account Has Been Created'),
    }
  }

  // ==================== STUDENT EMAILS ====================

  static studentWelcome(data: {
    email: string
    fullName: string
    matricNumber: string
    program: string
    department: string
  }): EmailTemplate {
    const content = `
        <div class="greeting">Dear ${data.fullName},</div>
        <div class="message">
          <strong>Welcome to ${schoolFullName}!</strong> We are absolutely delighted to have you join our prestigious institution. Your student portal account has been <span class="success">activated</span>, and you can now access all the resources you need for your academic journey.
        </div>
        <div class="info-box">
          <h3>🎊 Your Student Information</h3>
          <ul>
            <li><strong>Matric Number:</strong> <span class="highlight">${data.matricNumber}</span></li>
            <li><strong>Full Name:</strong> ${data.fullName}</li>
            <li><strong>Program:</strong> ${data.program}</li>
            <li><strong>Department:</strong> ${data.department}</li>
            <li><strong>Academic Session:</strong> ${new Date().getFullYear()}/${new Date().getFullYear() + 1}</li>
          </ul>
        </div>
        <div class="message">
          <strong>📚 What You Can Do in the Student Portal:</strong>
          <ul style="margin-top: 10px; padding-left: 20px; line-height: 2;">
            <li>View and track your academic results and grades</li>
            <li>Register for courses each semester</li>
            <li>Access online classes and learning materials</li>
            <li>View and download your timetable</li>
            <li>Make secure fee payments online</li>
            <li>Download course forms and receipts</li>
            <li>Access examination timetables and results</li>
            <li>Receive important notifications and announcements</li>
          </ul>
        </div>
        <div class="info-box">
          <h3>📌 Important Links & Contacts</h3>
          <ul>
            <li><strong>Student Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></li>
            <li><strong>School Website:</strong> <a href="${schoolWebsite}">${schoolWebsite}</a></li>
            <li><strong>Email:</strong> <a href="mailto:${schoolEmail}">${schoolEmail}</a></li>
            <li><strong>Phone:</strong> ${schoolPhone}</li>
            <li><strong>Address:</strong> ${schoolAddress}</li>
          </ul>
        </div>
        <div class="message">
          <strong>💡 Pro Tips:</strong>
          <ol style="margin-top: 10px; padding-left: 20px; line-height: 2;">
            <li>Bookmark the student portal for easy access</li>
            <li>Check your email regularly for important notifications</li>
            <li>Complete your profile information in the portal</li>
            <li>Register for courses early to avoid delays</li>
            <li>Make fee payments before the deadline</li>
          </ol>
        </div>
        <div class="message">
          <a href="${portalUrl}" class="button">🚀 Access Student Portal</a>
        </div>
        <div class="message">
          We are committed to providing you with quality education and an exceptional learning experience. Your future in health technology starts here at ${schoolFullName}!
        </div>
        <div class="message">
          If you have any questions or need assistance, please contact the Student Affairs Office at 
          <a href="mailto:${schoolEmail}">${schoolEmail}</a> or call ${schoolPhone}.
        </div>
        <div class="message">
          Best regards,<br>
          <strong>Student Affairs Office</strong><br>
          ${schoolFullName}<br>
          ${schoolAddress}<br>
          Email: <a href="mailto:${schoolEmail}">${schoolEmail}</a> | Phone: ${schoolPhone}
        </div>
      `

    return {
      to: data.email,
      subject: '🎓 Welcome to CCHT - Your Student Portal is Ready',
      html: wrapEmailContent(content, 'Welcome to CCHT - Your Student Portal is Ready'),
    }
  }

  static studentResultPublished(data: {
    email: string
    fullName: string
    course: string
    courseCode: string
    score: number
    grade: string
    semester: string
    academicYear: string
  }): EmailTemplate {
    const content = `
        <div class="greeting">Dear ${data.fullName},</div>
        <div class="message">
          We are pleased to inform you that a <strong>new result</strong> has been <span class="success">published</span> for you. Here are the details:
        </div>
        <div class="info-box">
          <h3>📊 Result Details</h3>
          <ul>
            <li><strong>Course Code:</strong> ${data.courseCode}</li>
            <li><strong>Course Title:</strong> ${data.course}</li>
            <li><strong>Score:</strong> <span class="highlight">${data.score}</span></li>
            <li><strong>Grade:</strong> <span class="highlight">${data.grade}</span></li>
            <li><strong>Semester:</strong> ${data.semester}</li>
            <li><strong>Academic Year:</strong> ${data.academicYear}</li>
            <li><strong>Published Date:</strong> ${new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</li>
          </ul>
        </div>
        <div class="message">
          <strong>📝 Important Notes:</strong>
          <ul style="margin-top: 10px; padding-left: 20px; line-height: 2;">
            <li>This result has been officially published by your lecturer</li>
            <li>Please review the result carefully</li>
            <li>If you have any concerns, contact the Academic Office within 7 days</li>
            <li>Keep a record of this result for your files</li>
          </ul>
        </div>
        <div class="info-box">
          <h3>📌 Quick Links</h3>
          <ul>
            <li><strong>Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></li>
            <li><strong>Academic Office:</strong> <a href="mailto:${schoolEmail}">${schoolEmail}</a></li>
            <li><strong>Phone:</strong> ${schoolPhone}</li>
          </ul>
        </div>
        <div class="message">
          <a href="${portalUrl}" class="button">View All Results</a>
        </div>
        <div class="message">
          Best regards,<br>
          <strong>Academic Office</strong><br>
          ${schoolFullName}<br>
          ${schoolAddress}<br>
          Email: <a href="mailto:${schoolEmail}">${schoolEmail}</a> | Phone: ${schoolPhone}
        </div>
      `

    return {
      to: data.email,
      subject: '📊 New Result Published - CCHT',
      html: wrapEmailContent(content, 'New Result Published - CCHT'),
    }
  }

  static studentCourseRegistration(data: {
    email: string
    fullName: string
    courses: Array<{ code: string; title: string; creditUnits: number }>
    semester: string
    academicYear: string
    totalCredits: number
  }): EmailTemplate {
    const coursesList = data.courses
      .map(c => `<li><strong>${c.code}</strong> - ${c.title} (${c.creditUnits} credits)</li>`)
      .join('')

    const content = `
        <div class="greeting">Dear ${data.fullName},</div>
        <div class="message">
          <strong>Course Registration Confirmed!</strong> Your course registration for the current semester has been <span class="success">successfully processed</span>. Here are your registration details:
        </div>
        <div class="info-box">
          <h3>📋 Registration Summary</h3>
          <ul>
            <li><strong>Student:</strong> ${data.fullName}</li>
            <li><strong>Semester:</strong> ${data.semester}</li>
            <li><strong>Academic Year:</strong> ${data.academicYear}</li>
            <li><strong>Total Credit Units:</strong> <span class="highlight">${data.totalCredits}</span></li>
            <li><strong>Registration Date:</strong> ${new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</li>
            <li><strong>Status:</strong> <span class="success">✓ Confirmed</span></li>
          </ul>
        </div>
        <div class="info-box">
          <h3>📖 Registered Courses</h3>
          <ul>${coursesList}</ul>
        </div>
        <div class="message">
          <strong>📝 Important Notes:</strong>
          <ul style="margin-top: 10px; padding-left: 20px; line-height: 2;">
            <li>Please review your course list carefully</li>
            <li>Contact the Academic Office if you need to make changes</li>
            <li>Download and keep your course form for your records</li>
            <li>Ensure you meet all prerequisites for each course</li>
            <li>Check your timetable for class schedules</li>
          </ul>
        </div>
        <div class="info-box">
          <h3>📌 Quick Links</h3>
          <ul>
            <li><strong>Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></li>
            <li><strong>Academic Office:</strong> <a href="mailto:${schoolEmail}">${schoolEmail}</a></li>
            <li><strong>Phone:</strong> ${schoolPhone}</li>
          </ul>
        </div>
        <div class="message">
          <a href="${portalUrl}" class="button">View Course Form</a>
        </div>
        <div class="message">
          Best regards,<br>
          <strong>Academic Office</strong><br>
          ${schoolFullName}<br>
          ${schoolAddress}<br>
          Email: <a href="mailto:${schoolEmail}">${schoolEmail}</a> | Phone: ${schoolPhone}
        </div>
      `

    return {
      to: data.email,
      subject: '📚 Course Registration Confirmation - CCHT',
      html: wrapEmailContent(content, 'Course Registration Confirmation - CCHT'),
    }
  }

  static studentFeeNotification(data: {
    email: string
    fullName: string
    feeType: string
    amount: number
    dueDate: string
    paymentLink?: string
  }): EmailTemplate {
    const content = `
        <div class="greeting">Dear ${data.fullName},</div>
        <div class="message">
          This is a friendly reminder that you have an <strong>outstanding fee payment</strong>. Please review the details below and make your payment before the due date to avoid penalties.
        </div>
        <div class="info-box">
          <h3>💰 Fee Details</h3>
          <ul>
            <li><strong>Student Name:</strong> ${data.fullName}</li>
            <li><strong>Fee Type:</strong> ${data.feeType}</li>
            <li><strong>Amount Due:</strong> <span class="highlight">₦${data.amount.toLocaleString()}</span></li>
            <li><strong>Due Date:</strong> <span class="warning">${data.dueDate}</span></li>
            <li><strong>Status:</strong> <span class="warning">Pending Payment</span></li>
          </ul>
        </div>
        <div class="message">
          <strong>📝 Important Information:</strong>
          <ul style="margin-top: 10px; padding-left: 20px; line-height: 2;">
            <li>Please make your payment before the due date to avoid late fees</li>
            <li>Keep your payment receipt for your records</li>
            <li>Payment can be made online through the student portal</li>
            <li>Contact the Finance Office if you have any questions</li>
          </ul>
        </div>
        ${data.paymentLink ? `
          <div class="message">
            <a href="${data.paymentLink}" class="button">💳 Pay Now</a>
          </div>
        ` : ''}
        <div class="info-box">
          <h3>📌 Need Help?</h3>
          <ul>
            <li><strong>Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></li>
            <li><strong>Finance Office:</strong> <a href="mailto:${schoolEmail}">${schoolEmail}</a></li>
            <li><strong>Phone:</strong> ${schoolPhone}</li>
            <li><strong>Address:</strong> ${schoolAddress}</li>
          </ul>
        </div>
        <div class="message">
          Best regards,<br>
          <strong>Finance Office</strong><br>
          ${schoolFullName}<br>
          ${schoolAddress}<br>
          Email: <a href="mailto:${schoolEmail}">${schoolEmail}</a> | Phone: ${schoolPhone}
        </div>
      `

    return {
      to: data.email,
      subject: `💰 Fee Payment Required - ${data.feeType}`,
      html: wrapEmailContent(content, `Fee Payment Required - ${data.feeType}`),
    }
  }

  static studentPasswordReset(data: {
    email: string
    fullName: string
    resetLink: string
  }): EmailTemplate {
    const content = `
        <div class="greeting">Dear ${data.fullName},</div>
        <div class="message">
          We received a request to reset your password for the <strong>Student Portal</strong>. Click the button below to reset it:
        </div>
        <div class="message">
          <a href="${data.resetLink}" class="button">Reset Password</a>
        </div>
        <div class="info-box">
          <h3>🔒 Security Information</h3>
          <ul>
            <li>This password reset link will <strong>expire in 1 hour</strong></li>
            <li>If you didn't request this reset, please ignore this email</li>
            <li>For security reasons, please use a <strong>strong password</strong></li>
            <li>Never share your login credentials with anyone</li>
            <li>Use a combination of letters, numbers, and special characters</li>
          </ul>
        </div>
        <div class="info-box">
          <h3>📌 Need Help?</h3>
          <ul>
            <li><strong>Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></li>
            <li><strong>Email:</strong> <a href="mailto:${schoolEmail}">${schoolEmail}</a></li>
            <li><strong>Phone:</strong> ${schoolPhone}</li>
          </ul>
        </div>
        <div class="message">
          Best regards,<br>
          <strong>IT Support Team</strong><br>
          ${schoolFullName}<br>
          ${schoolAddress}<br>
          Email: <a href="mailto:${schoolEmail}">${schoolEmail}</a> | Phone: ${schoolPhone}
        </div>
      `

    return {
      to: data.email,
      subject: '🔐 Password Reset Request - CCHT Student Portal',
      html: wrapEmailContent(content, 'Password Reset Request - CCHT Student Portal'),
    }
  }

  // ==================== LECTURER EMAILS ====================

  static lecturerWelcome(data: {
    email: string
    fullName: string
    employeeId: string
    department: string
    designation?: string
  }): EmailTemplate {
    const content = `
        <div class="greeting">Dear ${data.fullName},</div>
        <div class="message">
          <strong>Welcome to ${schoolFullName}!</strong> We are pleased to inform you that your lecturer account has been <span class="success">successfully created</span>. You are now part of our esteemed faculty, dedicated to shaping the future of health technology education.
        </div>
        <div class="info-box">
          <h3>👨‍🏫 Your Information</h3>
          <ul>
            <li><strong>Full Name:</strong> ${data.fullName}</li>
            <li><strong>Employee ID:</strong> <span class="highlight">${data.employeeId}</span></li>
            <li><strong>Department:</strong> ${data.department}</li>
            ${data.designation ? `<li><strong>Designation:</strong> ${data.designation}</li>` : ''}
            <li><strong>Email:</strong> ${data.email}</li>
            <li><strong>Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></li>
          </ul>
        </div>
        <div class="message">
          <strong>📚 Your Responsibilities in the Portal:</strong>
          <ul style="margin-top: 10px; padding-left: 20px; line-height: 2;">
            <li>Enter and manage student scores and grades</li>
            <li>Create and publish assessments and assignments</li>
            <li>Create and manage online classes</li>
            <li>Upload and manage course materials</li>
            <li>Publish examination results</li>
            <li>View student performance analytics</li>
            <li>Manage course schedules and timetables</li>
          </ul>
        </div>
        <div class="info-box">
          <h3>📌 Important Links & Contacts</h3>
          <ul>
            <li><strong>Lecturer Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></li>
            <li><strong>School Website:</strong> <a href="${schoolWebsite}">${schoolWebsite}</a></li>
            <li><strong>Academic Office:</strong> <a href="mailto:${schoolEmail}">${schoolEmail}</a></li>
            <li><strong>Phone:</strong> ${schoolPhone}</li>
            <li><strong>Address:</strong> ${schoolAddress}</li>
          </ul>
        </div>
        <div class="message">
          <strong>💡 Getting Started:</strong>
          <ol style="margin-top: 10px; padding-left: 20px; line-height: 2;">
            <li>Log in to the lecturer portal using your credentials</li>
            <li>Complete your profile information</li>
            <li>Set up your courses for the current semester</li>
            <li>Upload course materials and syllabus</li>
            <li>Familiarize yourself with the grading system</li>
          </ol>
        </div>
        <div class="message">
          <a href="${portalUrl}" class="button">🚀 Access Lecturer Portal</a>
        </div>
        <div class="message">
          We look forward to working with you and appreciate your dedication to education at ${schoolFullName}. Together, we will nurture the next generation of health technology professionals.
        </div>
        <div class="message">
          If you have any questions or need assistance, please contact the Academic Office at 
          <a href="mailto:${schoolEmail}">${schoolEmail}</a> or call ${schoolPhone}.
        </div>
        <div class="message">
          Best regards,<br>
          <strong>Academic Office</strong><br>
          ${schoolFullName}<br>
          ${schoolAddress}<br>
          Email: <a href="mailto:${schoolEmail}">${schoolEmail}</a> | Phone: ${schoolPhone}
        </div>
      `

    return {
      to: data.email,
      subject: '🎓 Welcome to CCHT - Lecturer Portal Access',
      html: wrapEmailContent(content, 'Welcome to CCHT - Lecturer Portal Access'),
    }
  }

  static lecturerPasswordReset(data: {
    email: string
    fullName: string
    resetLink: string
  }): EmailTemplate {
    const content = `
        <div class="greeting">Dear ${data.fullName},</div>
        <div class="message">
          We received a request to reset your password for the <strong>Lecturer Portal</strong>. Click the button below to reset it:
        </div>
        <div class="message">
          <a href="${data.resetLink}" class="button">Reset Password</a>
        </div>
        <div class="info-box">
          <h3>🔒 Security Information</h3>
          <ul>
            <li>This password reset link will <strong>expire in 1 hour</strong></li>
            <li>If you didn't request this reset, please ignore this email</li>
            <li>For security reasons, please use a <strong>strong password</strong></li>
            <li>Never share your login credentials with anyone</li>
          </ul>
        </div>
        <div class="info-box">
          <h3>📌 Need Help?</h3>
          <ul>
            <li><strong>Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></li>
            <li><strong>Email:</strong> <a href="mailto:${schoolEmail}">${schoolEmail}</a></li>
            <li><strong>Phone:</strong> ${schoolPhone}</li>
          </ul>
        </div>
        <div class="message">
          Best regards,<br>
          <strong>IT Support Team</strong><br>
          ${schoolFullName}<br>
          ${schoolAddress}<br>
          Email: <a href="mailto:${schoolEmail}">${schoolEmail}</a> | Phone: ${schoolPhone}
        </div>
      `

    return {
      to: data.email,
      subject: '🔐 Password Reset Request - CCHT Lecturer Portal',
      html: wrapEmailContent(content, 'Password Reset Request - CCHT Lecturer Portal'),
    }
  }

  // ==================== ADMIN EMAILS ====================

  static adminWelcome(data: {
    email: string
    fullName: string
    staffId: string
    role: string
  }): EmailTemplate {
    const content = `
        <div class="greeting">Dear ${data.fullName},</div>
        <div class="message">
          <strong>Welcome to ${schoolFullName}!</strong> Your admin account has been <span class="success">successfully created</span>. You are now part of our administrative team, responsible for ensuring the smooth operation of our institution.
        </div>
        <div class="info-box">
          <h3>👤 Your Information</h3>
          <ul>
            <li><strong>Full Name:</strong> ${data.fullName}</li>
            <li><strong>Staff ID:</strong> <span class="highlight">${data.staffId}</span></li>
            <li><strong>Role:</strong> ${data.role}</li>
            <li><strong>Email:</strong> ${data.email}</li>
            <li><strong>Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></li>
          </ul>
        </div>
        <div class="message">
          <strong>⚙️ Your Administrative Responsibilities:</strong>
          <ul style="margin-top: 10px; padding-left: 20px; line-height: 2;">
            <li>Manage user accounts and permissions</li>
            <li>Oversee academic operations and scheduling</li>
            <li>Create and manage announcements and content</li>
            <li>View analytics and generate reports</li>
            <li>Manage student and lecturer records</li>
            <li>Configure system settings and preferences</li>
            <li>Monitor system activity and performance</li>
          </ul>
        </div>
        <div class="info-box">
          <h3>📌 Important Links & Contacts</h3>
          <ul>
            <li><strong>Admin Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></li>
            <li><strong>School Website:</strong> <a href="${schoolWebsite}">${schoolWebsite}</a></li>
            <li><strong>System Administrator:</strong> <a href="mailto:${schoolEmail}">${schoolEmail}</a></li>
            <li><strong>Phone:</strong> ${schoolPhone}</li>
            <li><strong>Address:</strong> ${schoolAddress}</li>
          </ul>
        </div>
        <div class="message">
          <strong>💡 Getting Started:</strong>
          <ol style="margin-top: 10px; padding-left: 20px; line-height: 2;">
            <li>Log in to the admin portal using your credentials</li>
            <li>Complete your profile information</li>
            <li>Familiarize yourself with the admin dashboard</li>
            <li>Review user permissions and access levels</li>
            <li>Set up notifications and alerts</li>
          </ol>
        </div>
        <div class="message">
          <a href="${portalUrl}" class="button">🚀 Access Admin Portal</a>
        </div>
        <div class="message">
          We trust you with these administrative privileges and look forward to your contributions in making ${schoolFullName} a world-class institution. Your leadership and dedication are essential to our success.
        </div>
        <div class="message">
          If you have any questions or need assistance, please contact the System Administrator at 
          <a href="mailto:${schoolEmail}">${schoolEmail}</a> or call ${schoolPhone}.
        </div>
        <div class="message">
          Best regards,<br>
          <strong>System Administrator</strong><br>
          ${schoolFullName}<br>
          ${schoolAddress}<br>
          Email: <a href="mailto:${schoolEmail}">${schoolEmail}</a> | Phone: ${schoolPhone}
        </div>
      `

    return {
      to: data.email,
      subject: '🎉 Welcome to CCHT - Admin Portal Access',
      html: wrapEmailContent(content, 'Welcome to CCHT - Admin Portal Access'),
    }
  }

  static adminPasswordReset(data: {
    email: string
    fullName: string
    resetLink: string
  }): EmailTemplate {
    const content = `
        <div class="greeting">Dear ${data.fullName},</div>
        <div class="message">
          We received a request to reset your password for the <strong>Admin Portal</strong>. Click the button below to reset it:
        </div>
        <div class="message">
          <a href="${data.resetLink}" class="button">Reset Password</a>
        </div>
        <div class="info-box">
          <h3>🔒 Security Information</h3>
          <ul>
            <li>This password reset link will <strong>expire in 1 hour</strong></li>
            <li>If you didn't request this reset, please ignore this email</li>
            <li>For security reasons, please use a <strong>strong password</strong></li>
            <li>Never share your login credentials with anyone</li>
            <li>Use a combination of letters, numbers, and special characters</li>
          </ul>
        </div>
        <div class="info-box">
          <h3>📌 Need Help?</h3>
          <ul>
            <li><strong>Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></li>
            <li><strong>Email:</strong> <a href="mailto:${schoolEmail}">${schoolEmail}</a></li>
            <li><strong>Phone:</strong> ${schoolPhone}</li>
          </ul>
        </div>
        <div class="message">
          Best regards,<br>
          <strong>IT Support Team</strong><br>
          ${schoolFullName}<br>
          ${schoolAddress}<br>
          Email: <a href="mailto:${schoolEmail}">${schoolEmail}</a> | Phone: ${schoolPhone}
        </div>
      `

    return {
      to: data.email,
      subject: '🔐 Password Reset Request - CCHT Admin Portal',
      html: wrapEmailContent(content, 'Password Reset Request - CCHT Admin Portal'),
    }
  }

  static adminNewUserNotification(data: {
    email: string
    fullName: string
    newUserName: string
    newUserEmail: string
    newUserRole: string
  }): EmailTemplate {
    const content = `
        <div class="greeting">Dear ${data.fullName},</div>
        <div class="message">
          A new user account has been created in the system. Here are the details:
        </div>
        <div class="info-box">
          <h3>New User Information</h3>
          <ul>
            <li><strong>Name:</strong> ${data.newUserName}</li>
            <li><strong>Email:</strong> ${data.newUserEmail}</li>
            <li><strong>Role:</strong> ${data.newUserRole}</li>
            <li><strong>Created By:</strong> ${data.fullName}</li>
          </ul>
        </div>
        <div class="message">
          <a href="${portalUrl}" class="button">View Users</a>
        </div>
        <div class="message">
          Best regards,<br>
          <strong>System Administrator</strong><br>
          ${schoolFullName}
        </div>
      `

    return {
      to: data.email,
      subject: `New ${data.newUserRole} Account Created - CCHT`,
      html: wrapEmailContent(content, `New ${data.newUserRole} Account Created - CCHT`),
    }
  }

  // ==================== GENERAL EMAILS ====================

  static announcement(data: {
    email: string
    fullName: string
    title: string
    message: string
    link?: string
  }): EmailTemplate {
    const content = `
        <div class="greeting">Dear ${data.fullName},</div>
        <div class="message">
          <strong>${data.title}</strong>
        </div>
        <div class="info-box">
          <p>${data.message}</p>
        </div>
        ${data.link ? `
          <div class="message">
            <a href="${data.link}" class="button">Learn More</a>
          </div>
        ` : ''}
        <div class="message">
          Best regards,<br>
          <strong>${schoolFullName} Administration</strong>
        </div>
      `

    return {
      to: data.email,
      subject: `Announcement: ${data.title}`,
      html: wrapEmailContent(content, `Announcement: ${data.title}`),
    }
  }

  static eventNotification(data: {
    email: string
    fullName: string
    eventTitle: string
    eventDate: string
    eventTime: string
    eventLocation: string
    eventDescription: string
    eventUrl: string
  }): EmailTemplate {
    const content = `
        <div class="greeting">Dear ${data.fullName},</div>
        <div class="message">
          You are invited to an upcoming event at ${schoolName}:
        </div>
        <div class="info-box">
          <h3>Event Details</h3>
          <ul>
            <li><strong>Event:</strong> ${data.eventTitle}</li>
            <li><strong>Date:</strong> ${data.eventDate}</li>
            <li><strong>Time:</strong> ${data.eventTime}</li>
            <li><strong>Location:</strong> ${data.eventLocation}</li>
          </ul>
          <p style="margin-top: 15px;">${data.eventDescription}</p>
        </div>
        <div class="message">
          <a href="${data.eventUrl}" class="button">View Event Details</a>
        </div>
        <div class="message">
          We look forward to seeing you there!
        </div>
        <div class="message">
          Best regards,<br>
          <strong>Events Committee</strong><br>
          ${schoolFullName}
        </div>
      `

    return {
      to: data.email,
      subject: `Upcoming Event: ${data.eventTitle}`,
      html: wrapEmailContent(content, `Upcoming Event: ${data.eventTitle}`),
    }
  }
}