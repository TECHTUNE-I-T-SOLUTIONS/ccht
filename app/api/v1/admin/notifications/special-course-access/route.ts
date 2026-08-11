import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EmailTemplates } from '@/lib/services/email-templates'
import { emailService } from '@/lib/services/email.service'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, studentName } = body

    if (!email || !studentName) {
      return NextResponse.json({ error: 'Email and student name are required' }, { status: 400 })
    }

    // Create email notification for special course access
    const specialAccessEmail = EmailTemplates.specialCourseAccessGranted({
      email,
      fullName: studentName,
    })

    // Send the email
    await emailService.sendEmailAsync(specialAccessEmail)

    return NextResponse.json({ 
      success: true, 
      message: 'Special access notification sent successfully' 
    })
  } catch (error: any) {
    console.error('Error sending special access notification:', error)
    return NextResponse.json({ 
      error: error?.message || 'Failed to send notification' 
    }, { status: 500 })
  }
}
