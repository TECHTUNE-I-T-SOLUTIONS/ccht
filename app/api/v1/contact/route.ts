import { ContactFormSchema } from '@/lib/validation';
import { EmailService } from '@/lib/services/email.service';
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

    // Send email to admin and confirmation to user
    await EmailService.sendContactFormEmail(name, email, subject, message);

    return NextResponse.json(
      {
        success: true,
        message: 'Your message has been sent successfully. We will get back to you shortly.',
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
