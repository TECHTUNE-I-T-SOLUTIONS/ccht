import { NextResponse } from 'next/server'
import { TeacherDashboardService } from '@/lib/services/teacher-dashboard.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { EmailTemplates } from '@/lib/services/email-templates'
import { emailService } from '@/lib/services/email.service'
import { wrapEmailContent } from '@/lib/services/email-templates'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (sessionId) {
      const data = await TeacherDashboardService.getTimetableEntriesBySession(sessionId)
      return NextResponse.json({ data })
    }
    
    const data = await TeacherDashboardService.getTeacherTimetable()
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load timetable' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('POST timetable entry body:', body)
    
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('timetable_entries')
      .insert({
        timetable_session_id: body.timetable_session_id,
        course_id: body.course_id,
        day_of_week: body.day_of_week,
        start_time: body.start_time,
        end_time: body.end_time,
        venue: body.venue,
        lecturer_id: user.id,
      })
      .select()
      .single()

    console.log('Insert error:', error)
    if (error) throw new Error(error.message)

    // Send timetable notification to enrolled students
    try {
      // Get all students enrolled in the course
      const { data: enrollments } = await admin
        .from('student_enrollments')
        .select('student_id')
        .eq('course_id', body.course_id)

      if (enrollments && enrollments.length > 0) {
        const studentIds = enrollments.map(e => e.student_id)
        
        const { data: students } = await admin
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', studentIds)
          .eq('is_active', true)

        if (students && students.length > 0) {
          // Get course details
          const { data: course } = await admin
            .from('courses')
            .select('title, code')
            .eq('id', body.course_id)
            .single()

          // Get day name
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          const dayName = dayNames[parseInt(body.day_of_week)] || body.day_of_week

          for (const student of students) {
            try {
              // Use a custom notification email for timetable updates
              const customContent = `
                <div class="greeting">Dear ${student.first_name} ${student.last_name},</div>
                <div class="message">
                  <strong>Timetable Update Notification</strong><br><br>
                  A new timetable entry has been added for your course:
                </div>
                <div class="info-box">
                  <h3>📅 Timetable Details</h3>
                  <ul>
                    <li><strong>Course:</strong> ${course?.title || 'N/A'} (${course?.code || 'N/A'})</li>
                    <li><strong>Day:</strong> ${dayName}</li>
                    <li><strong>Time:</strong> ${body.start_time} - ${body.end_time}</li>
                    <li><strong>Venue:</strong> ${body.venue || 'TBD'}</li>
                  </ul>
                </div>
                <div class="message">
                  Please check your student portal for the complete timetable.
                </div>
                <div class="message">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/student/timetable" class="button">View Timetable</a>
                </div>
              `
              
              const timetableEmail = {
                to: student.email,
                subject: `Timetable Update - ${course?.title || 'Course'}`,
                html: wrapEmailContent(customContent, `Timetable Update - ${course?.title || 'Course'}`),
              }
              emailService.sendEmailAsync(timetableEmail)
            } catch (emailError) {
              console.error('Error sending timetable email to student:', student.email, emailError)
            }
          }
        }
      }
    } catch (notificationError) {
      console.error('Error sending timetable notifications:', notificationError)
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('POST timetable error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to create timetable entry' }, { status: 500 })
  }
}
