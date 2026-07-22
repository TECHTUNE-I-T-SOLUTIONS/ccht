import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCourseFormPDF } from '@/lib/templates/course-form'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { session, semester } = body

    if (!session) {
      return NextResponse.json({ error: 'Session is required' }, { status: 400 })
    }

    // Fetch student data
    const [profileRes, studentProfileRes, enrollmentRes, selectedRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('student_profiles').select('*').eq('profile_id', user.id).single(),
      supabase.from('enrollments').select('*, program:programs(title, department:departments(name))').eq('student_id', user.id).eq('status', 'active').single(),
      supabase
        .from('selected_courses')
        .select('*, course:courses(*)')
        .eq('student_id', user.id)
        .eq('session', session)
        .eq('status', 'approved')
    ])

    const profileData = {
      firstName: profileRes.data?.first_name || '',
      lastName: profileRes.data?.last_name || '',
      email: profileRes.data?.email || '',
      phone: studentProfileRes.data?.student_number || profileRes.data?.phone || null,
      matricNumber: studentProfileRes.data?.matric_number || null,
      currentLevel: studentProfileRes.data?.current_level || null,
      admissionSession: studentProfileRes.data?.admission_session || null,
      programTitle: enrollmentRes.data?.program?.title || null,
      departmentName: enrollmentRes.data?.program?.department?.name || null,
    }

    let courses = selectedRes.data || []
    if (semester && semester !== 'all') {
      courses = courses.filter((sc: any) => sc.semester === semester)
    }

    const courseData = courses.map((sc: any) => ({
      code: sc.course?.code || '',
      title: sc.course?.title || '',
      credits: sc.course?.credit_units || 0,
      semester: sc.semester || '',
      level: sc.course?.level || '',
      reviewedAt: sc.reviewed_at || null,
    }))

    const pdfBytes = await generateCourseFormPDF({
      student: profileData,
      courses: courseData,
      session,
      semester: semester || 'all',
    })

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="course-form-${profileData.matricNumber || 'student'}-${session}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate PDF' }, { status: 500 })
  }
}
