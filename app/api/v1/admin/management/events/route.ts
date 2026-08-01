import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { EmailTemplates } from '@/lib/services/email-templates'
import { emailService } from '@/lib/services/email.service'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('events')
      .select('*, organizer:profiles(first_name, last_name)')
      .order('event_date', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: error?.message || 'Failed to load events' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.title || !body.description || !body.event_date) {
      return NextResponse.json({ error: 'title, description, and event_date are required' }, { status: 400 })
    }

    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const { data, error } = await adminSupabase
      .from('events')
      .insert({
        title: body.title,
        slug,
        description: body.description,
        event_date: body.event_date,
        event_end_date: body.event_end_date || null,
        location: body.location || null,
        featured_image_url: body.featured_image_url || null,
        registration_link: body.registration_link || null,
        organizer_id: user.id,
        is_published: body.is_published ?? false,
      })
      .select()
      .single()

    if (error) throw error

    // Send event notification email if published
    if (body.is_published) {
      try {
        // Get all students and lecturers to notify
        const { data: students } = await adminSupabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('role', 'student')
          .eq('is_active', true)

        const { data: lecturers } = await adminSupabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('role', 'lecturer')
          .eq('is_active', true)

        const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/events/${slug}`

        // Send emails to students
        if (students && students.length > 0) {
          for (const student of students) {
            try {
              const eventEmail = EmailTemplates.eventNotification({
                email: student.email,
                fullName: `${student.first_name} ${student.last_name}`,
                eventTitle: body.title,
                eventDate: new Date(body.event_date).toLocaleDateString('en-NG', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }),
                eventTime: new Date(body.event_date).toLocaleTimeString('en-NG', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }),
                eventLocation: body.location || 'TBD',
                eventDescription: body.description,
                eventUrl,
              })
              emailService.sendEmailAsync(eventEmail)
            } catch (emailError) {
              console.error('Error sending event email to student:', student.email, emailError)
            }
          }
        }

        // Send emails to lecturers
        if (lecturers && lecturers.length > 0) {
          for (const lecturer of lecturers) {
            try {
              const eventEmail = EmailTemplates.eventNotification({
                email: lecturer.email,
                fullName: `${lecturer.first_name} ${lecturer.last_name}`,
                eventTitle: body.title,
                eventDate: new Date(body.event_date).toLocaleDateString('en-NG', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }),
                eventTime: new Date(body.event_date).toLocaleTimeString('en-NG', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }),
                eventLocation: body.location || 'TBD',
                eventDescription: body.description,
                eventUrl,
              })
              emailService.sendEmailAsync(eventEmail)
            } catch (emailError) {
              console.error('Error sending event email to lecturer:', lecturer.email, emailError)
            }
          }
        }
      } catch (notificationError) {
        console.error('Error sending event notifications:', notificationError)
        // Don't fail the request if notifications fail
      }
    }

    return NextResponse.json({ success: true, data, message: 'Event created successfully' })
  } catch (error: any) {
    console.error('Event creation error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to create event' }, { status: 500 })
  }
}
