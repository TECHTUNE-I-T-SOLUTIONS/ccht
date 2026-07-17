import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()

    // Update aspirant profile stage to admission_fee
    const { error: updateError } = await adminSupabase
      .from('aspirant_profiles')
      .update({ 
        current_stage: 'admission_fee',
        exam_completed: true,
        exam_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('profile_id', user.id)

    if (updateError) {
      console.error('Failed to update profile stage:', updateError)
      return NextResponse.json({ error: 'Failed to update profile stage' }, { status: 500 })
    }

    // Create notification for aspirant
    await adminSupabase
      .from('aspirant_notifications')
      .insert({
        aspirant_id: user.id,
        title: 'Exam Completed',
        message: 'Your entrance examination has been completed successfully. Please proceed to the admission fee payment stage.',
        notification_type: 'exam',
        category: 'progress',
        priority: 'normal',
        deep_link: '/aspirant/admission-fee',
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error completing exam:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
