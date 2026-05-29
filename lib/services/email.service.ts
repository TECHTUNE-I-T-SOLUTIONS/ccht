import { SCHOOL_INFO } from '@/lib/constants';
import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  static async sendVerificationEmail(email: string, verificationUrl: string): Promise<void> {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${SCHOOL_INFO.name}</h2>
          <p>Please verify your email address to complete your registration.</p>
          <p>
            <a href="${verificationUrl}" style="background-color: #e03a3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p>Or copy this link: <code>${verificationUrl}</code></p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            This email was sent because you registered on ${SCHOOL_INFO.name}. If you didn't register, please ignore this email.
          </p>
        </div>
      `;

      await this.transporter.sendMail({
        from: `${SCHOOL_INFO.name} <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Verify your email - ${SCHOOL_INFO.name}`,
        html: htmlContent,
      });

      console.log(`[ccht] Verification email sent to ${email}`);
    } catch (error) {
      console.error('[ccht] Error sending verification email:', error);
      // Don't throw - email failures shouldn't block signup
    }
  }

  static async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your password. Click the link below to proceed.</p>
          <p>
            <a href="${resetUrl}" style="background-color: #e03a3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p>Or copy this link: <code>${resetUrl}</code></p>
          <p style="color: #666; font-size: 12px;">This link will expire in 1 hour.</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      `;

      await this.transporter.sendMail({
        from: `${SCHOOL_INFO.name} <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Reset Your Password - ${SCHOOL_INFO.name}`,
        html: htmlContent,
      });

      console.log(`[ccht] Password reset email sent to ${email}`);
    } catch (error) {
      console.error('[ccht] Error sending password reset email:', error);
    }
  }

  static async sendPaymentConfirmationEmail(
    email: string,
    studentName: string,
    amount: number,
    reference: string
  ): Promise<void> {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Payment Received</h2>
          <p>Dear ${studentName},</p>
          <p>We have received your payment. Thank you!</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <p><strong>Amount:</strong> ₦${amount.toFixed(2)}</p>
            <p><strong>Reference:</strong> ${reference}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <p>Your payment has been processed successfully. Your account has been updated.</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            If you have any questions, please contact us at ${SCHOOL_INFO.email}
          </p>
        </div>
      `;

      await this.transporter.sendMail({
        from: `${SCHOOL_INFO.name} <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Payment Confirmation - ${SCHOOL_INFO.name}`,
        html: htmlContent,
      });

      console.log(`[ccht] Payment confirmation email sent to ${email}`);
    } catch (error) {
      console.error('[ccht] Error sending payment confirmation email:', error);
    }
  }

  static async sendContactFormEmail(
    name: string,
    email: string,
    subject: string,
    message: string
  ): Promise<void> {
    try {
      const adminContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        </div>
      `;

      await this.transporter.sendMail({
        from: `${SCHOOL_INFO.name} <${process.env.SMTP_USER}>`,
        to: SCHOOL_INFO.email,
        subject: `Contact Form: ${subject}`,
        html: adminContent,
      });

      // Send confirmation to user
      const userContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thank You for Contacting Us</h2>
          <p>Dear ${name},</p>
          <p>We have received your message and will respond to you as soon as possible.</p>
          <p>Best regards,<br />${SCHOOL_INFO.name}</p>
        </div>
      `;

      await this.transporter.sendMail({
        from: `${SCHOOL_INFO.name} <${process.env.SMTP_USER}>`,
        to: email,
        subject: `We received your message - ${SCHOOL_INFO.name}`,
        html: userContent,
      });

      console.log(`[ccht] Contact form email sent to ${SCHOOL_INFO.email}`);
    } catch (error) {
      console.error('[ccht] Error sending contact form email:', error);
    }
  }

  static async sendEnrollmentConfirmationEmail(
    email: string,
    studentName: string,
    programName: string
  ): Promise<void> {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Enrollment Confirmed</h2>
          <p>Dear ${studentName},</p>
          <p>Congratulations! Your enrollment has been confirmed.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <p><strong>Program:</strong> ${programName}</p>
            <p><strong>Enrollment Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <p>You can now log in to your student portal to view your courses and pay your fees.</p>
          <hr />
          <p style="color: #666; font-size: 12px;">
            If you have any questions, please contact us at ${SCHOOL_INFO.email}
          </p>
        </div>
      `;

      await this.transporter.sendMail({
        from: `${SCHOOL_INFO.name} <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Enrollment Confirmed - ${SCHOOL_INFO.name}`,
        html: htmlContent,
      });

      console.log(`[ccht] Enrollment confirmation email sent to ${email}`);
    } catch (error) {
      console.error('[ccht] Error sending enrollment confirmation email:', error);
    }
  }
}
