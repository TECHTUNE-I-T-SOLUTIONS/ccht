import { createClient as createServerClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'

export type AspirantProfile = {
  profile_id: string
  admission_number: string | null
  jamb_reg_no: string
  preferred_program_id: string | null
  application_type: string
  application_status: string
  current_stage: string
  profile_completion: number
  admission_session: string | null
  submission_notes: string | null
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  review_feedback: string | null
  created_at: string
  updated_at: string
}

export type AdmissionDocument = {
  id: string
  application_id: string
  uploaded_by: string
  document_type: string
  storage_bucket: string
  storage_path: string
  file_name: string
  mime_type: string | null
  file_size: number | null
  verification_status: string
  verification_note: string | null
  uploaded_at: string
  verified_by: string | null
  verified_at: string | null
  created_at: string
  updated_at: string
}

export type ProfilePhoto = {
  id: string
  application_id: string
  uploaded_by: string
  storage_bucket: string
  storage_path: string
  file_name: string
  mime_type: string | null
  file_size: number | null
  is_primary: boolean
  created_at: string
  updated_at: string
  image_url?: string | null
}

export type AdmissionDocumentWithUrl = AdmissionDocument & {
  file_url?: string | null
}

export class AdmissionService {
  static async createSignedUrl(bucket: string, path: string, expiresIn = 60 * 60) {
    const supabase = await createServerClient()
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
    if (error) throw new Error(error.message)
    return data?.signedUrl || null
  }

  static async getAspirantProfile(profileId: string): Promise<AspirantProfile | null> {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('aspirant_profiles')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle()

    if (error) throw new Error('Failed to load aspirant profile')
    return data || null
  }

  static async getAdmissionDocuments(profileId: string): Promise<AdmissionDocument[]> {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('admission_documents')
      .select('*')
      .eq('uploaded_by', profileId)
      .order('uploaded_at', { ascending: false })

    if (error) throw new Error('Failed to load admission documents')

    const documents = data || []
    return Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        file_url: await this.createSignedUrl(doc.storage_bucket, doc.storage_path).catch(() => null),
      })),
    ) as Promise<AdmissionDocumentWithUrl[]>
  }

  static async getProfilePhotos(profileId: string): Promise<ProfilePhoto[]> {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('aspirant_profile_photos')
      .select('*')
      .eq('uploaded_by', profileId)
      .order('created_at', { ascending: false })

    if (error) throw new Error('Failed to load profile photos')

    const photos = data || []
    return Promise.all(
      photos.map(async (photo) => ({
        ...photo,
        image_url: await this.createSignedUrl(photo.storage_bucket, photo.storage_path).catch(() => null),
      })),
    )
  }

  static async uploadProfilePhoto(profileId: string, file: File, userId: string) {
    return this.uploadProfilePhotoForUser(profileId, userId, file)
  }

  static async uploadProfilePhotoForUser(profileId: string, uploadedBy: string, file: File) {
    const supabase = await createServerClient()
    const fileExt = file.name.split('.').pop() || 'jpg'
    const filePath = `${uploadedBy}/${crypto.randomUUID()}-passport.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      })

    if (uploadError) throw new Error(uploadError.message)

    const { data: inserted, error: insertError } = await supabase
      .from('aspirant_profile_photos')
      .insert({
        application_id: profileId,
        uploaded_by: uploadedBy,
        storage_bucket: 'profile-photos',
        storage_path: filePath,
        file_name: file.name,
        mime_type: file.type || null,
        file_size: file.size,
      })
      .select()
      .single()

    if (insertError) throw new Error(insertError.message)

    await supabase
      .from('profiles')
      .update({
        profile_photo_bucket: 'profile-photos',
        profile_photo_path: filePath,
        profile_photo_mime_type: file.type || null,
        profile_photo_uploaded_by: uploadedBy,
        profile_photo_uploaded_at: new Date().toISOString(),
        avatar_url: filePath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)

    return inserted
  }

  static async uploadAdmissionDocument(
    profileId: string,
    userId: string,
    file: File,
    documentType: string,
  ) {
    const supabase = await createServerClient()
    const fileExt = file.name.split('.').pop() || 'pdf'
    const filePath = `${userId}/${documentType}/${crypto.randomUUID()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('admission-documents')
      .upload(filePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) throw new Error(uploadError.message)

    const { data, error } = await supabase
      .from('admission_documents')
      .insert({
        application_id: profileId,
        uploaded_by: userId,
        document_type: documentType,
        storage_bucket: 'admission-documents',
        storage_path: filePath,
        file_name: file.name,
        mime_type: file.type || null,
        file_size: file.size,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }
}
