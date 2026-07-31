# CCHT Email Service Documentation

## Overview
The CCHT Email Service is a professional, asynchronous email system designed for Covenant College of Health Technology. It supports multiple SMTP providers (Gmail, Namecheap, Zoho, Custom) and includes comprehensive email templates for all user types.

## Features
- ✅ Asynchronous email sending (non-blocking)
- ✅ Multiple SMTP provider support
- ✅ Professional HTML email templates
- ✅ School branding and styling
- ✅ Comprehensive error handling
- ✅ Fire-and-forget architecture

## Setup Instructions

### 1. Install Dependencies
```bash
pnpm add nodemailer @types/nodemailer
```

### 2. Configure Environment Variables
Add these to your `.env.local` file:

```env
# Email Provider: gmail, namecheap, zoho, or custom
EMAIL_PROVIDER=gmail

# Common settings
EMAIL_FROM_NAME=CCHT School
EMAIL_FROM_EMAIL=cchtschool206@gmail.com

# Option 1: Gmail (recommended)
# Get app password from: https://myaccount.google.com/apppasswords
GMAIL_APP_PASSWORD=your-gmail-app-password-here

# Option 2: Namecheap Private Email
# EMAIL_HOST=smtp.privateemail.com
# EMAIL_PORT=587
# EMAIL_SECURE=false
# EMAIL_PASSWORD=your-email-password

# Option 3: Zoho Mail
# EMAIL_HOST=smtp.zoho.com
# EMAIL_PORT=587
# EMAIL_SECURE=false
# EMAIL_PASSWORD=your-zoho-password

# Option 4: Custom SMTP
# EMAIL_HOST=smtp.your-provider.com
# EMAIL_PORT=587
# EMAIL_SECURE=false
# EMAIL_PASSWORD=your-email-password
```

### 3. Gmail Setup Instructions
1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate new app password for "Mail" and "Windows"
4. Copy the 16-character password
5. Paste it in `.env.local` as `GMAIL_APP_PASSWORD`

## Usage

### Sending Emails via API

#### Using Predefined Templates
```typescript
const response = await fetch('/api/v1/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    template: 'aspirant.application_received',
    templateData: {
      email: 'applicant@example.com',
      fullName: 'John Doe',
      applicationId: 'APP-12345',
      program: 'Medical Laboratory Science'
    }
  })
})
```

#### Using Custom Email
```typescript
const response = await fetch('/api/v1/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'recipient@example.com',
    subject: 'Custom Subject',
    html: '<p>Custom HTML content</p>'
  })
})
```

### Available Email Templates

#### Aspirant Templates
- `aspirant.application_received` - Sent when application is submitted
- `aspirant.status_update` - Sent when application status changes
- `aspirant.document_update` - Sent when document is reviewed
- `aspirant.payment_receipt` - Sent when payment is made
- `aspirant.admitted` - Sent when applicant is admitted
- `aspirant.migrated_to_student` - Sent when aspirant becomes student

#### Student Templates
- `student.welcome` - Sent when student account is created
- `student.result_published` - Sent when result is published
- `student.course_registration` - Sent when courses are registered
- `student.fee_notification` - Sent for fee payments
- `student.password_reset` - Sent for password reset

#### Lecturer Templates
- `lecturer.welcome` - Sent when lecturer account is created
- `lecturer.password_reset` - Sent for password reset

#### Admin Templates
- `admin.welcome` - Sent when admin account is created
- `admin.password_reset` - Sent for password reset
- `admin.new_user_notification` - Sent when new user is created

#### General Templates
- `announcement` - For general announcements
- `event_notification` - For event notifications

## Email Template Data Requirements

### aspirant.application_received
```typescript
{
  email: string
  fullName: string
  applicationId: string
  program: string
}
```

### aspirant.status_update
```typescript
{
  email: string
  fullName: string
  status: string
  message: string
  applicationId: string
}
```

### aspirant.document_update
```typescript
{
  email: string
  fullName: string
  documentType: string
  status: string
  message?: string
  applicationId: string
}
```

### aspirant.payment_receipt
```typescript
{
  email: string
  fullName: string
  amount: number
  paymentReference: string
  paymentDate: string
  receiptUrl?: string
  applicationId?: string
}
```

### aspirant.admitted
```typescript
{
  email: string
  fullName: string
  program: string
  matricNumber: string
  admissionLetterUrl?: string
  oathFormUrl?: string
  applicationId?: string
}
```

### aspirant.migrated_to_student
```typescript
{
  email: string
  fullName: string
  matricNumber: string
  password: string
  program: string
  department: string
  applicationId?: string
}
```

### student.welcome
```typescript
{
  email: string
  fullName: string
  matricNumber: string
  program: string
  department: string
}
```

### student.result_published
```typescript
{
  email: string
  fullName: string
  course: string
  courseCode: string
  score: number
  grade: string
  semester: string
  academicYear: string
}
```

### student.course_registration
```typescript
{
  email: string
  fullName: string
  courses: Array<{ code: string; title: string; creditUnits: number }>
  semester: string
  academicYear: string
  totalCredits: number
}
```

### student.fee_notification
```typescript
{
  email: string
  fullName: string
  feeType: string
  amount: number
  dueDate: string
  paymentLink?: string
}
```

### student.password_reset
```typescript
{
  email: string
  fullName: string
  resetLink: string
}
```

### lecturer.welcome
```typescript
{
  email: string
  fullName: string
  employeeId: string
  department: string
  designation?: string
}
```

### lecturer.password_reset
```typescript
{
  email: string
  fullName: string
  resetLink: string
}
```

### admin.welcome
```typescript
{
  email: string
  fullName: string
  staffId: string
  role: string
}
```

### admin.password_reset
```typescript
{
  email: string
  fullName: string
  resetLink: string
}
```

### admin.new_user_notification
```typescript
{
  email: string
  fullName: string
  newUserName: string
  newUserEmail: string
  newUserRole: string
}
```

### announcement
```typescript
{
  email: string
  fullName: string
  title: string
  message: string
  link?: string
}
```

### event_notification
```typescript
{
  email: string
  fullName: string
  eventName: string
  eventDate: string
  eventTime: string
  location: string
  description: string
}
```

## API Endpoints

### POST /api/v1/email/send
Send an email using a template or custom content.

**Request Body:**
```json
{
  "template": "aspirant.application_received",
  "templateData": { /* template-specific data */ }
}
```
OR
```json
{
  "to": "recipient@example.com",
  "subject": "Subject",
  "html": "<p>HTML content</p>",
  "attachments": []
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email queued for sending"
}
```

### GET /api/v1/email/send
Verify email configuration.

**Response:**
```json
{
  "status": "connected",
  "message": "Email service is configured correctly"
}
```

## Important Notes

1. **Asynchronous Sending**: Emails are sent asynchronously and won't block the main application flow. If email sending fails, it won't affect the user experience.

2. **Error Handling**: The email service logs errors but doesn't throw exceptions to prevent application crashes.

3. **Professional Templates**: All email templates include:
   - School logo and branding
   - Professional HTML styling
   - Contact information
   - Important links
   - Responsive design

4. **Security**: 
   - Never commit `.env.local` to version control
   - Use app-specific passwords for Gmail
   - Keep SMTP credentials secure

5. **Testing**: Use the GET endpoint to verify email configuration before sending emails.

## Troubleshooting

### Emails Not Sending
1. Check `.env.local` has correct SMTP credentials
2. Verify Gmail app password is correct (if using Gmail)
3. Check email service logs in console
4. Use GET /api/v1/email/send to verify connection

### Gmail Issues
1. Ensure 2FA is enabled on Google account
2. Generate app-specific password
3. Use the app password, not your regular password
4. Check that "Less secure app access" is enabled (if not using app password)

### Template Not Found
- Ensure template name matches exactly (case-sensitive)
- Check that all required templateData fields are provided

## Support
For issues or questions, contact the IT Support Team at:
- Email: info@covenantcollegeofhealthtech.com.ng
- Phone: +234 7066 3698 18