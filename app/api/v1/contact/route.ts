import { ContactFormSchema } from '@/lib/validation';
import { emailService } from '@/lib/services/email.service';
import { wrapEmailContent } from '@/lib/services/email-templates';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = ContactFormSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = validationResult.data;

    // Save to database
    const supabase = await createClient();
    const { data: contactMessage, error: dbError } = await supabase
      .from('contact_messages')
      .insert({
        full_name: name,
        email,
        subject,
        message,
        status: 'new',
      })
      .select()
      .single();

    if (dbError) {
      console.error('[ccht] Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save message to database' },
        { status: 500 }
      );
    }

    // Try to send email (don't fail if email service is down)
    try {
      const emailContent = `
        <div class="greeting">New Contact Form Submission</div>
        <div class="info-box">
          <h3>Contact Details</h3>
          <ul>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Subject:</strong> ${subject}</li>
          </ul>
        </div>
        <div class="message">
          <strong>Message:</strong>
          <p style="margin-top: 10px; padding: 15px; background: #f8fafc; border-radius: 8px;">${message}</p>
        </div>
      `
      
      await emailService.sendEmail({
        to: 'info@covenantcollegeofhealthtech.com.ng',
        subject: `Contact Form: ${subject} - ${name}`,
        html: wrapEmailContent(emailContent, 'Contact Form Submission'),
      })
    } catch (emailError) {
      // Silently fail - message is already saved to DB
      // Email service may not be configured
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Your message has been sent successfully. We will get back to you shortly.',
        data: contactMessage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ccht] Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
