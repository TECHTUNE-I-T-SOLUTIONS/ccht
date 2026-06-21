-- Admissions, aspirants, document uploads, and secure storage setup
-- Run after the base schema and role refactor migrations.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure the profiles role check supports aspirants.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_role_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'lecturer', 'admin', 'super_admin', 'aspirant'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_photo_bucket text NOT NULL DEFAULT 'profile-photos',
  ADD COLUMN IF NOT EXISTS profile_photo_path text UNIQUE,
  ADD COLUMN IF NOT EXISTS profile_photo_mime_type text,
  ADD COLUMN IF NOT EXISTS profile_photo_uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS profile_photo_uploaded_at timestamptz;

-- Aspirant profile holds admission-only details.
CREATE TABLE IF NOT EXISTS public.aspirant_profiles (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  admission_number text UNIQUE,
  jamb_reg_no text UNIQUE NOT NULL,
  preferred_program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  application_type text NOT NULL DEFAULT 'Fresh admission'
    CHECK (application_type IN ('Fresh admission', 'Transfer candidate', 'Returning applicant', 'Special consideration')),
  application_status text NOT NULL DEFAULT 'draft'
    CHECK (application_status IN ('draft', 'incomplete', 'submitted', 'under_review', 'correction_required', 'approved', 'rejected')),
  current_stage text NOT NULL DEFAULT 'signup'
    CHECK (current_stage IN ('signup', 'profile', 'course_selection', 'review', 'submitted', 'admitted')),
  profile_completion integer NOT NULL DEFAULT 0 CHECK (profile_completion >= 0 AND profile_completion <= 100),
  admission_session text,
  submission_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.admin_profiles(profile_id) ON DELETE SET NULL,
  review_feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aspirant_profiles_status ON public.aspirant_profiles(application_status);
CREATE INDEX IF NOT EXISTS idx_aspirant_profiles_jamb_reg_no ON public.aspirant_profiles(jamb_reg_no);

-- Track document uploads separately from the file storage.
CREATE TABLE IF NOT EXISTS public.admission_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.aspirant_profiles(profile_id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN (
    'passport_photo',
    'signature',
    'birth_certificate',
    'age_declaration',
    'primary_certificate',
    'secondary_certificate',
    'indigene_certificate',
    'nin_slip',
    'jamb_result',
    'jamb_registration_form',
    'other'
  )),
  storage_bucket text NOT NULL DEFAULT 'admission-documents',
  storage_path text NOT NULL UNIQUE,
  file_name text NOT NULL,
  mime_type text,
  file_size bigint,
  verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'needs_correction')),
  verification_note text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  verified_by uuid REFERENCES public.admin_profiles(profile_id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admission_documents_application_id ON public.admission_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_admission_documents_uploaded_by ON public.admission_documents(uploaded_by);

-- Optional passport photo for aspirants, used later as their profile photo.
CREATE TABLE IF NOT EXISTS public.aspirant_profile_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.aspirant_profiles(profile_id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_bucket text NOT NULL DEFAULT 'profile-photos',
  storage_path text NOT NULL UNIQUE,
  file_name text NOT NULL,
  mime_type text,
  file_size bigint,
  is_primary boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aspirant_profile_photos_application_id ON public.aspirant_profile_photos(application_id);
CREATE INDEX IF NOT EXISTS idx_aspirant_profile_photos_uploaded_by ON public.aspirant_profile_photos(uploaded_by);

-- Timeline for admission actions and feedback.
CREATE TABLE IF NOT EXISTS public.admission_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.aspirant_profiles(profile_id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  note text,
  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admission_status_history_application_id ON public.admission_status_history(application_id);

-- Keep aspirant profile timestamps current.
DROP TRIGGER IF EXISTS set_updated_at_aspirant_profiles ON public.aspirant_profiles;
CREATE TRIGGER set_updated_at_aspirant_profiles
BEFORE UPDATE ON public.aspirant_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_admission_documents ON public.admission_documents;
CREATE TRIGGER set_updated_at_admission_documents
BEFORE UPDATE ON public.admission_documents
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Allow signup trigger to create aspirant records.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := LOWER(COALESCE(new.raw_user_meta_data ->> 'role', 'student'));
  IF v_role = 'teacher' THEN
    v_role := 'lecturer';
  END IF;

  IF v_role NOT IN ('student', 'lecturer', 'admin', 'super_admin', 'aspirant') THEN
    v_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    new.id,
    COALESCE(new.email, ''),
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    v_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    updated_at = NOW();

  IF v_role = 'student' THEN
    INSERT INTO public.student_profiles (profile_id)
    VALUES (new.id)
    ON CONFLICT (profile_id) DO NOTHING;
  ELSIF v_role = 'lecturer' THEN
    INSERT INTO public.lecturer_profiles (profile_id)
    VALUES (new.id)
    ON CONFLICT (profile_id) DO NOTHING;
  ELSIF v_role = 'aspirant' THEN
    INSERT INTO public.aspirant_profiles (profile_id, jamb_reg_no)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data ->> 'jamb_reg_no', '')
    )
    ON CONFLICT (profile_id) DO NOTHING;
  ELSE
    INSERT INTO public.admin_profiles (profile_id)
    VALUES (new.id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admission tables RLS
ALTER TABLE public.aspirant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aspirant_profile_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS aspirant_profiles_select_self_or_admin ON public.aspirant_profiles;
CREATE POLICY aspirant_profiles_select_self_or_admin
ON public.aspirant_profiles
FOR SELECT
USING (profile_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS aspirant_profiles_insert_self ON public.aspirant_profiles;
CREATE POLICY aspirant_profiles_insert_self
ON public.aspirant_profiles
FOR INSERT
WITH CHECK (profile_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS aspirant_profiles_update_self_or_admin ON public.aspirant_profiles;
CREATE POLICY aspirant_profiles_update_self_or_admin
ON public.aspirant_profiles
FOR UPDATE
USING (profile_id = auth.uid() OR public.is_admin())
WITH CHECK (profile_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS admission_documents_select_own_or_admin ON public.admission_documents;
CREATE POLICY admission_documents_select_own_or_admin
ON public.admission_documents
FOR SELECT
USING (uploaded_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS admission_documents_insert_own_or_admin ON public.admission_documents;
CREATE POLICY admission_documents_insert_own_or_admin
ON public.admission_documents
FOR INSERT
WITH CHECK (uploaded_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS admission_documents_update_own_or_admin ON public.admission_documents;
CREATE POLICY admission_documents_update_own_or_admin
ON public.admission_documents
FOR UPDATE
USING (uploaded_by = auth.uid() OR public.is_admin())
WITH CHECK (uploaded_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS admission_documents_delete_own_or_admin ON public.admission_documents;
CREATE POLICY admission_documents_delete_own_or_admin
ON public.admission_documents
FOR DELETE
USING (uploaded_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS admission_status_history_select_self_or_admin ON public.admission_status_history;
CREATE POLICY admission_status_history_select_self_or_admin
ON public.admission_status_history
FOR SELECT
USING (
  application_id = auth.uid()
  OR public.is_admin()
  OR EXISTS (
    SELECT 1
    FROM public.aspirant_profiles ap
    WHERE ap.profile_id = admission_status_history.application_id
      AND ap.profile_id = auth.uid()
  )
);

DROP POLICY IF EXISTS admission_status_history_insert_admin_only ON public.admission_status_history;
CREATE POLICY admission_status_history_insert_admin_only
ON public.admission_status_history
FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS aspirant_profile_photos_select_own_or_admin ON public.aspirant_profile_photos;
CREATE POLICY aspirant_profile_photos_select_own_or_admin
ON public.aspirant_profile_photos
FOR SELECT
USING (uploaded_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS aspirant_profile_photos_insert_own_or_admin ON public.aspirant_profile_photos;
CREATE POLICY aspirant_profile_photos_insert_own_or_admin
ON public.aspirant_profile_photos
FOR INSERT
WITH CHECK (uploaded_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS aspirant_profile_photos_update_own_or_admin ON public.aspirant_profile_photos;
CREATE POLICY aspirant_profile_photos_update_own_or_admin
ON public.aspirant_profile_photos
FOR UPDATE
USING (uploaded_by = auth.uid() OR public.is_admin())
WITH CHECK (uploaded_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS aspirant_profile_photos_delete_own_or_admin ON public.aspirant_profile_photos;
CREATE POLICY aspirant_profile_photos_delete_own_or_admin
ON public.aspirant_profile_photos
FOR DELETE
USING (uploaded_by = auth.uid() OR public.is_admin());

-- Private storage bucket for admission uploads.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'admission-documents'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('admission-documents', 'admission-documents', false);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'profile-photos'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('profile-photos', 'profile-photos', false);
  END IF;
END $$;

DROP POLICY IF EXISTS admission_documents_bucket_select ON storage.objects;
CREATE POLICY admission_documents_bucket_select
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'admission-documents'
  AND (
    auth.role() = 'service_role'
    OR public.is_admin()
    OR (
      auth.uid() IS NOT NULL
      AND (name LIKE auth.uid()::text || '/%' OR name LIKE 'public/%')
    )
  )
);

DROP POLICY IF EXISTS admission_documents_bucket_insert ON storage.objects;
CREATE POLICY admission_documents_bucket_insert
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'admission-documents'
  AND auth.uid() IS NOT NULL
  AND name LIKE auth.uid()::text || '/%'
);

DROP POLICY IF EXISTS admission_documents_bucket_update ON storage.objects;
CREATE POLICY admission_documents_bucket_update
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'admission-documents'
  AND (
    public.is_admin()
    OR (
      auth.uid() IS NOT NULL
      AND name LIKE auth.uid()::text || '/%'
    )
  )
)
WITH CHECK (
  bucket_id = 'admission-documents'
  AND (
    public.is_admin()
    OR (
      auth.uid() IS NOT NULL
      AND name LIKE auth.uid()::text || '/%'
    )
  )
);

DROP POLICY IF EXISTS admission_documents_bucket_delete ON storage.objects;
CREATE POLICY admission_documents_bucket_delete
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'admission-documents'
  AND (
    public.is_admin()
    OR (
      auth.uid() IS NOT NULL
      AND name LIKE auth.uid()::text || '/%'
    )
  )
);

DROP POLICY IF EXISTS profile_photos_bucket_select ON storage.objects;
CREATE POLICY profile_photos_bucket_select
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'profile-photos'
  AND (
    auth.role() = 'service_role'
    OR public.is_admin()
    OR (
      auth.uid() IS NOT NULL
      AND (name LIKE auth.uid()::text || '/%' OR name LIKE 'public/%')
    )
  )
);

DROP POLICY IF EXISTS profile_photos_bucket_insert ON storage.objects;
CREATE POLICY profile_photos_bucket_insert
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos'
  AND auth.uid() IS NOT NULL
  AND name LIKE auth.uid()::text || '/%'
);

DROP POLICY IF EXISTS profile_photos_bucket_update ON storage.objects;
CREATE POLICY profile_photos_bucket_update
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profile-photos'
  AND (
    public.is_admin()
    OR (
      auth.uid() IS NOT NULL
      AND name LIKE auth.uid()::text || '/%'
    )
  )
)
WITH CHECK (
  bucket_id = 'profile-photos'
  AND (
    public.is_admin()
    OR (
      auth.uid() IS NOT NULL
      AND name LIKE auth.uid()::text || '/%'
    )
  )
);

DROP POLICY IF EXISTS profile_photos_bucket_delete ON storage.objects;
CREATE POLICY profile_photos_bucket_delete
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-photos'
  AND (
    public.is_admin()
    OR (
      auth.uid() IS NOT NULL
      AND name LIKE auth.uid()::text || '/%'
    )
  )
);
