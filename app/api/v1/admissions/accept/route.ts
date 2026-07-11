import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load aspirant profile
    const { data: aspirant, error: aspirantError } = await supabase
      .from('aspirant_profiles')
      .select('*, preferred_program_id(*)')
      .eq('profile_id', user.id)
      .single()

    if (aspirantError || !aspirant) {
      return NextResponse.json({ error: 'Aspirant profile not found' }, { status: 404 })
    }

    // Verify payment of N30,000 administrative fee exists and is success
    const { data: payments, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', user.id)
      .eq('amount', 30000)
      .eq('status', 'success')

    if (paymentError || !payments || payments.length === 0) {
      return NextResponse.json({ error: 'Administrative payment of ₦30,000 not verified. Please pay to continue.' }, { status: 400 })
    }

    // Generate Matriculation Number: CCHT/DEPT/YEAR/ID (e.g. CCHT/CHT/2026/003)
    const currentYear = new Date().getFullYear().toString()
    
    // Map program titles to codes
    let deptCode = 'CHT'
    const programTitle = aspirant.preferred_program_id?.title || ''
    if (programTitle.toLowerCase().includes('laboratory') || programTitle.toLowerCase().includes('mlt')) {
      deptCode = 'MLT'
    } else if (programTitle.toLowerCase().includes('public') || programTitle.toLowerCase().includes('pbh')) {
      deptCode = 'PBH'
    } else if (programTitle.toLowerCase().includes('pharmacy') || programTitle.toLowerCase().includes('pht')) {
      deptCode = 'PHT'
    }

    // Fetch existing students in this department and year to get the next sequential number
    const pattern = `CCHT/${deptCode}/${currentYear}/%`
    const { data: students, error: studentError } = await supabase
      .from('student_profiles')
      .select('matric_number')
      .like('matric_number', pattern)

    let nextId = 1
    if (!studentError && students && students.length > 0) {
      const numbers = students
        .map((s: { matric_number: string | null }) => {
          const parts = s.matric_number?.split('/') || []
          const lastPart = parts[parts.length - 1]
          return parseInt(lastPart, 10)
        })
        .filter((n: number) => !isNaN(n))
      
      if (numbers.length > 0) {
        nextId = Math.max(...numbers) + 1
      }
    }

    const paddedId = nextId.toString().padStart(3, '0')
    const matricNumber = `CCHT/${deptCode}/${currentYear}/${paddedId}`

    // Start migrating candidate to student role
    // 1) Update profile role to student
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ role: 'student' })
      .eq('id', user.id)

    if (profileUpdateError) {
      return NextResponse.json({ error: 'Failed to update user profile role' }, { status: 500 })
    }

    // 2) Insert/Update student profiles
    const { error: deleteStudentProfileError } = await supabase
      .from('student_profiles')
      .delete()
      .eq('profile_id', user.id)

    if (deleteStudentProfileError) {
      return NextResponse.json({ error: 'Failed to reset previous student profile state' }, { status: 500 })
    }

    const { error: insertStudentProfileError } = await supabase
      .from('student_profiles')
      .insert({
        profile_id: user.id,
        student_number: matricNumber,
        matric_number: matricNumber,
        admission_session: `${currentYear}/${parseInt(currentYear) + 1}`,
        admission_date: new Date().toISOString().split('T')[0],
        current_level: '100',
        admission_status: 'active',
      })

    if (insertStudentProfileError) {
      // Revert role
      await supabase.from('profiles').update({ role: 'aspirant' }).eq('id', user.id)
      return NextResponse.json({ error: 'Failed to create student profile' }, { status: 500 })
    }

    // 3) Update aspirant profile status
    await supabase
      .from('aspirant_profiles')
      .update({
        application_status: 'approved',
        current_stage: 'admitted',
        admission_number: matricNumber,
      })
      .eq('profile_id', user.id)

    return NextResponse.json({
      success: true,
      matricNumber,
      message: 'Congratulations! You have been migrated to the student portal.',
    })
  } catch (error) {
    console.error('Acceptance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
