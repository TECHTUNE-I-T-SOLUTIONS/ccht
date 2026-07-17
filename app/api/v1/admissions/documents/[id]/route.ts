import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params
    
    // Get user from Supabase session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    
    // Get document details first
    const { data: document, error: fetchError } = await adminSupabase
      .from('admission_documents')
      .select('*')
      .eq('id', documentId)
      .single()
    
    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    
    // Delete from admission_documents table
    const { error: deleteError } = await adminSupabase
      .from('admission_documents')
      .delete()
      .eq('id', documentId)
    
    if (deleteError) {
      console.error('Error deleting document:', deleteError)
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }
    
    // If it's a passport photo, also delete from aspirant_profile_photos
    if (document.document_type === 'passport_photo') {
      await adminSupabase
        .from('aspirant_profile_photos')
        .delete()
        .eq('id', documentId)
      
      // Update profiles table to remove photo
      await adminSupabase
        .from('profiles')
        .update({
          profile_photo_path: null,
          profile_photo_mime_type: null,
          profile_photo_uploaded_by: null,
          profile_photo_uploaded_at: null,
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', document.uploaded_by)
    }
    
    // Update profile progress
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/admissions/complete-documents`, {
        method: 'POST',
      }).catch(() => {})
    } catch (error) {
      console.error('Error updating profile progress:', error)
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Document deleted successfully' 
    })
    
  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}