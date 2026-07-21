import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use admin client to get all documents with aspirant information
    const adminSupabase = createAdminClient()
    const { data: documents, error: documentsError } = await adminSupabase
      .from('admission_documents')
      .select(`
        *,
        aspirant_profiles!admission_documents_application_id_fkey (
          profile_id,
          admission_number,
          jamb_reg_no
        )
      `)
      .order('uploaded_at', { ascending: false })

    if (documentsError) {
      console.error('Failed to fetch documents:', documentsError)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Get aspirant profile information separately for each document
    const documentsWithAspirantInfo = await Promise.all(
      (documents || []).map(async (doc) => {
        let aspirantInfo = null
        if (doc.aspirant_profiles?.profile_id) {
          const { data: profile } = await adminSupabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', doc.aspirant_profiles.profile_id)
            .single()
          
          if (profile) {
            aspirantInfo = {
              aspirant_name: `${profile.first_name} ${profile.last_name}`,
              aspirant_email: profile.email,
            }
          }
        }

        return {
          ...doc,
          ...aspirantInfo,
        }
      })
    )

    return NextResponse.json({ success: true, data: documentsWithAspirantInfo })
  } catch (error) {
    console.error('Fetch documents error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, verification_status, verification_note } = body

    if (!id || !verification_status) {
      return NextResponse.json({ error: 'Document ID and verification status are required' }, { status: 400 })
    }

    // Use admin client to update document
    const adminSupabase = createAdminClient()
    const { error: updateError } = await adminSupabase
      .from('admission_documents')
      .update({
        verification_status,
        verification_note,
        verified_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to update document:', updateError)
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update document error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
