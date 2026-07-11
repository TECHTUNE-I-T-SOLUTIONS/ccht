-- 006_cleanup_and_enhancements.sql
-- Normalize admissions around aspirants -> students, remove legacy term assumptions,
-- and prepare the schema for semester/session-based academics.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Admissions: JAMB is optional now, but the column remains for future use.
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.aspirant_profiles
  ALTER COLUMN jamb_reg_no DROP NOT NULL;

-- Make sure the signup trigger can still write nullable jamb values.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_jamb TEXT;
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
    v_jamb := NULLIF(TRIM(COALESCE(new.raw_user_meta_data ->> 'jamb_reg_no', '')), '');
    INSERT INTO public.aspirant_profiles (profile_id, jamb_reg_no)
    VALUES (new.id, v_jamb)
    ON CONFLICT (profile_id) DO NOTHING;
  ELSE
    INSERT INTO public.admin_profiles (profile_id)
    VALUES (new.id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Academic structure: terms are replaced by semesters.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academic_semesters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  semester_name text NOT NULL CHECK (semester_name IN ('First Semester', 'Second Semester')),
  starts_on date,
  ends_on date,
  is_current boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, semester_name)
);

-- Migrate any legacy terms into semesters before dropping term tables.
INSERT INTO public.academic_semesters (
  id, session_id, semester_name, starts_on, ends_on, is_current, is_active, created_at, updated_at
)
SELECT
  t.id,
  t.session_id,
  CASE
    WHEN t.term_name ILIKE 'first%' THEN 'First Semester'
    ELSE 'Second Semester'
  END,
  t.starts_on,
  t.ends_on,
  t.is_current,
  t.is_active,
  t.created_at,
  t.updated_at
FROM public.academic_terms t
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.course_teacher_assignments
  ADD COLUMN IF NOT EXISTS semester_id uuid;
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS semester_id uuid;
ALTER TABLE public.result_publications
  ADD COLUMN IF NOT EXISTS semester_id uuid;
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS semester_id uuid;

UPDATE public.course_teacher_assignments cta
SET semester_id = t.id
FROM public.academic_terms t
WHERE cta.term_id = t.id
  AND cta.semester_id IS NULL;

UPDATE public.assessments a
SET semester_id = t.id
FROM public.academic_terms t
WHERE a.term_id = t.id
  AND a.semester_id IS NULL;

UPDATE public.result_publications rp
SET semester_id = t.id
FROM public.academic_terms t
WHERE rp.term_id = t.id
  AND rp.semester_id IS NULL;

UPDATE public.invoices i
SET semester_id = t.id
FROM public.academic_terms t
WHERE i.term_id = t.id
  AND i.semester_id IS NULL;

ALTER TABLE public.course_teacher_assignments
  DROP CONSTRAINT IF EXISTS course_teacher_assignments_term_id_fkey;
ALTER TABLE public.assessments
  DROP CONSTRAINT IF EXISTS assessments_term_id_fkey;
ALTER TABLE public.result_publications
  DROP CONSTRAINT IF EXISTS result_publications_term_id_fkey;
ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_term_id_fkey;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'course_teacher_assignments_semester_id_fkey'
  ) THEN
    ALTER TABLE public.course_teacher_assignments
      ADD CONSTRAINT course_teacher_assignments_semester_id_fkey
      FOREIGN KEY (semester_id) REFERENCES public.academic_semesters(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assessments_semester_id_fkey'
  ) THEN
    ALTER TABLE public.assessments
      ADD CONSTRAINT assessments_semester_id_fkey
      FOREIGN KEY (semester_id) REFERENCES public.academic_semesters(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'result_publications_semester_id_fkey'
  ) THEN
    ALTER TABLE public.result_publications
      ADD CONSTRAINT result_publications_semester_id_fkey
      FOREIGN KEY (semester_id) REFERENCES public.academic_semesters(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invoices_semester_id_fkey'
  ) THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_semester_id_fkey
      FOREIGN KEY (semester_id) REFERENCES public.academic_semesters(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.course_teacher_assignments DROP COLUMN IF EXISTS term_id;
ALTER TABLE public.assessments DROP COLUMN IF EXISTS term_id;
ALTER TABLE public.result_publications DROP COLUMN IF EXISTS term_id;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS term_id;
ALTER TABLE public.payments DROP COLUMN IF EXISTS term_id;

DROP TABLE IF EXISTS public.academic_terms CASCADE;
DROP TABLE IF EXISTS public.teacher_notifications CASCADE;
DROP TABLE IF EXISTS public.teacher_profiles CASCADE;

CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_number text UNIQUE,
  staff_number text UNIQUE,
  qualification text,
  specialization text,
  department text,
  employment_type text CHECK (employment_type IN ('full_time', 'part_time', 'adjunct', 'contract')),
  date_joined date,
  office_location text,
  office_hours text,
  can_publish_results boolean NOT NULL DEFAULT false,
  can_enter_scores boolean NOT NULL DEFAULT true,
  employment_status text DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teacher_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teacher_profiles(profile_id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL DEFAULT 'general',
  category text,
  deep_link text,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  sent_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Assessments: detailed CA structure.
-- ---------------------------------------------------------------------------
ALTER TABLE public.assessments DROP COLUMN IF EXISTS total_score;
ALTER TABLE public.assessments DROP COLUMN IF EXISTS continuous_assessment;
ALTER TABLE public.assessments DROP COLUMN IF EXISTS ca_1;
ALTER TABLE public.assessments DROP COLUMN IF EXISTS ca_2;
ALTER TABLE public.assessments DROP COLUMN IF EXISTS assignments;

ALTER TABLE public.assessments ADD COLUMN ca_1 numeric DEFAULT 0 CHECK (ca_1 >= 0 AND ca_1 <= 15);
ALTER TABLE public.assessments ADD COLUMN ca_2 numeric DEFAULT 0 CHECK (ca_2 >= 0 AND ca_2 <= 15);
ALTER TABLE public.assessments ADD COLUMN assignments numeric DEFAULT 0 CHECK (assignments >= 0 AND assignments <= 10);
ALTER TABLE public.assessments ADD COLUMN continuous_assessment numeric GENERATED ALWAYS AS (COALESCE(ca_1, 0) + COALESCE(ca_2, 0) + COALESCE(assignments, 0)) STORED;
ALTER TABLE public.assessments ADD COLUMN total_score numeric GENERATED ALWAYS AS (COALESCE(ca_1, 0) + COALESCE(ca_2, 0) + COALESCE(assignments, 0) + COALESCE(exam_score, 0)) STORED;

-- ---------------------------------------------------------------------------
-- Cloudinary storage migration support.
-- Existing storage columns stay in place for compatibility, but we add a clear
-- provider marker so code can branch cleanly.
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS media_provider text NOT NULL DEFAULT 'cloudinary';

ALTER TABLE public.aspirant_profile_photos
  ADD COLUMN IF NOT EXISTS media_provider text NOT NULL DEFAULT 'cloudinary';

ALTER TABLE public.admission_documents
  ADD COLUMN IF NOT EXISTS media_provider text NOT NULL DEFAULT 'cloudinary';

-- ---------------------------------------------------------------------------
-- Proctoring logs for the exam flow.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.proctoring_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aspirant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  violation_details text,
  screenshot_url text,
  device_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proctoring_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS proctoring_logs_select_own_or_admin ON public.proctoring_logs;
CREATE POLICY proctoring_logs_select_own_or_admin ON public.proctoring_logs
  FOR SELECT USING (aspirant_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS proctoring_logs_insert_own ON public.proctoring_logs;
CREATE POLICY proctoring_logs_insert_own ON public.proctoring_logs
  FOR INSERT WITH CHECK (aspirant_id = auth.uid());

COMMIT;
