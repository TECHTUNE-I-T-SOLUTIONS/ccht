import { ContactFormSchema } from '@/lib/validation';
import { EmailService } from '@/lib/services/email.service';
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
      await EmailService.sendContactFormEmail(name, email, subject, message);
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
