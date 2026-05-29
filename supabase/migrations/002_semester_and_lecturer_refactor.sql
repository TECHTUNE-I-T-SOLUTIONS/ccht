-- Phase 2: Semester + Lecturer refactor for tertiary institution model
-- This migration is additive and backward-compatible with earlier teacher/term naming.

BEGIN;

-- ============================================
-- 1) Roles: teacher -> lecturer
-- ============================================
UPDATE public.profiles
SET role = 'lecturer'
WHERE role = 'teacher';

DO $$
DECLARE
  c RECORD;
BEGIN
  -- Drop any existing role check constraint on profiles so we can re-create it safely.
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', c.conname);
  END LOOP;

  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('student', 'lecturer', 'admin', 'super_admin'));
END $$;

-- ============================================
-- 2) Lecturer profile + notification tables
-- ============================================
CREATE TABLE IF NOT EXISTS public.lecturer_profiles (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_number TEXT UNIQUE,
  staff_number TEXT UNIQUE,
  qualification TEXT,
  specialization TEXT,
  department TEXT,
  employment_type TEXT CHECK (employment_type IN ('full_time', 'part_time', 'adjunct', 'contract')),
  date_joined DATE,
  office_location TEXT,
  office_hours TEXT,
  can_publish_results BOOLEAN NOT NULL DEFAULT FALSE,
  can_enter_scores BOOLEAN NOT NULL DEFAULT TRUE,
  employment_status TEXT DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.lecturer_profiles (
  profile_id, employee_number, staff_number, qualification, specialization, department,
  employment_type, date_joined, office_location, office_hours,
  can_publish_results, can_enter_scores, employment_status, created_at, updated_at
)
SELECT
  tp.profile_id, tp.employee_number, tp.staff_number, tp.qualification, tp.specialization, tp.department,
  tp.employment_type, tp.date_joined, tp.office_location, tp.office_hours,
  tp.can_publish_results, tp.can_enter_scores, tp.employment_status, tp.created_at, tp.updated_at
FROM public.teacher_profiles tp
ON CONFLICT (profile_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.lecturer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id UUID NOT NULL REFERENCES public.lecturer_profiles(profile_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'general',
  category TEXT,
  deep_link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  sent_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.lecturer_notifications (
  id, lecturer_id, title, message, notification_type, category, deep_link,
  is_read, read_at, sent_by, created_at, updated_at
)
SELECT
  tn.id, tn.teacher_id, tn.title, tn.message, tn.notification_type, tn.category, tn.deep_link,
  tn.is_read, tn.read_at, tn.sent_by, tn.created_at, tn.updated_at
FROM public.teacher_notifications tn
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3) Semesters replacing terms (backward compatible)
-- ============================================
CREATE TABLE IF NOT EXISTS public.academic_semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  semester_name TEXT NOT NULL CHECK (semester_name IN ('First Semester', 'Second Semester')),
  starts_on DATE,
  ends_on DATE,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, semester_name)
);

INSERT INTO public.academic_semesters (
  id, session_id, semester_name, starts_on, ends_on, is_current, is_active, created_at, updated_at
)
SELECT
  t.id,
  t.session_id,
  CASE
    WHEN t.term_name = 'First Term' THEN 'First Semester'
    WHEN t.term_name = 'Second Term' THEN 'Second Semester'
    ELSE 'Second Semester'
  END AS semester_name,
  t.starts_on,
  t.ends_on,
  t.is_current,
  t.is_active,
  t.created_at,
  t.updated_at
FROM public.academic_terms t
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assessments' AND column_name = 'term_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assessments' AND column_name = 'semester_id'
  ) THEN
    ALTER TABLE public.assessments ADD COLUMN semester_id UUID;
    UPDATE public.assessments SET semester_id = term_id WHERE semester_id IS NULL;
    ALTER TABLE public.assessments
      ADD CONSTRAINT assessments_semester_id_fkey
      FOREIGN KEY (semester_id) REFERENCES public.academic_semesters(id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'result_publications' AND column_name = 'term_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'result_publications' AND column_name = 'semester_id'
  ) THEN
    ALTER TABLE public.result_publications ADD COLUMN semester_id UUID;
    UPDATE public.result_publications SET semester_id = term_id WHERE semester_id IS NULL;
    ALTER TABLE public.result_publications
      ADD CONSTRAINT result_publications_semester_id_fkey
      FOREIGN KEY (semester_id) REFERENCES public.academic_semesters(id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'term_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'semester_id'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN semester_id UUID;
    UPDATE public.invoices SET semester_id = term_id WHERE semester_id IS NULL;
    ALTER TABLE public.invoices
      ADD CONSTRAINT invoices_semester_id_fkey
      FOREIGN KEY (semester_id) REFERENCES public.academic_semesters(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- 4) Lecturer columns (backward compatible)
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assessments' AND column_name = 'teacher_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assessments' AND column_name = 'lecturer_id'
  ) THEN
    ALTER TABLE public.assessments ADD COLUMN lecturer_id UUID;
    UPDATE public.assessments SET lecturer_id = teacher_id WHERE lecturer_id IS NULL;
    ALTER TABLE public.assessments
      ADD CONSTRAINT assessments_lecturer_id_fkey
      FOREIGN KEY (lecturer_id) REFERENCES public.lecturer_profiles(profile_id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'course_teacher_assignments' AND column_name = 'teacher_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'course_teacher_assignments' AND column_name = 'lecturer_id'
  ) THEN
    ALTER TABLE public.course_teacher_assignments ADD COLUMN lecturer_id UUID;
    UPDATE public.course_teacher_assignments SET lecturer_id = teacher_id WHERE lecturer_id IS NULL;
    ALTER TABLE public.course_teacher_assignments
      ADD CONSTRAINT course_teacher_assignments_lecturer_id_fkey
      FOREIGN KEY (lecturer_id) REFERENCES public.lecturer_profiles(profile_id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- 5) Role helper functions updated
-- ============================================
CREATE OR REPLACE FUNCTION public.is_lecturer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() IN ('lecturer', 'teacher'), FALSE);
$$;

-- Keep old function name for compatibility with existing policies/triggers.
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_lecturer();
$$;

-- ============================================
-- 6) Notification functions updated for lecturer terminology
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_lecturers(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'general',
  p_category TEXT DEFAULT NULL,
  p_deep_link TEXT DEFAULT NULL,
  p_sent_by UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.lecturer_notifications (
    lecturer_id, title, message, notification_type, category, deep_link, sent_by
  )
  SELECT
    lp.profile_id, p_title, p_message, p_type, p_category, p_deep_link, p_sent_by
  FROM public.lecturer_profiles lp;
END;
$$;

-- Compatibility wrapper for existing trigger/function calls.
CREATE OR REPLACE FUNCTION public.notify_teachers(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'general',
  p_category TEXT DEFAULT NULL,
  p_deep_link TEXT DEFAULT NULL,
  p_sent_by UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_lecturers(p_title, p_message, p_type, p_category, p_deep_link, p_sent_by);
END;
$$;

-- ============================================
-- 7) Auth signup trigger updated for lecturer role
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := LOWER(COALESCE(new.raw_user_meta_data ->> 'role', 'student'));
  IF v_role = 'teacher' THEN
    v_role := 'lecturer';
  END IF;

  IF v_role NOT IN ('student', 'lecturer', 'admin', 'super_admin') THEN
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
  ELSE
    INSERT INTO public.admin_profiles (profile_id)
    VALUES (new.id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8) RLS for new lecturer tables
-- ============================================
ALTER TABLE public.lecturer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecturer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_semesters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lecturer_profiles_select ON public.lecturer_profiles;
CREATE POLICY lecturer_profiles_select ON public.lecturer_profiles
FOR SELECT USING (profile_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS lecturer_profiles_modify_self_or_admin ON public.lecturer_profiles;
CREATE POLICY lecturer_profiles_modify_self_or_admin ON public.lecturer_profiles
FOR ALL USING (profile_id = auth.uid() OR public.is_admin())
WITH CHECK (profile_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS lecturer_notifications_select_own ON public.lecturer_notifications;
CREATE POLICY lecturer_notifications_select_own ON public.lecturer_notifications
FOR SELECT USING (lecturer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS lecturer_notifications_update_own ON public.lecturer_notifications;
CREATE POLICY lecturer_notifications_update_own ON public.lecturer_notifications
FOR UPDATE USING (lecturer_id = auth.uid() OR public.is_admin())
WITH CHECK (lecturer_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS lecturer_notifications_insert_by_admin ON public.lecturer_notifications;
CREATE POLICY lecturer_notifications_insert_by_admin ON public.lecturer_notifications
FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lecturer_notifications_delete_admin ON public.lecturer_notifications;
CREATE POLICY lecturer_notifications_delete_admin ON public.lecturer_notifications
FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS academic_semesters_read_authenticated ON public.academic_semesters;
CREATE POLICY academic_semesters_read_authenticated ON public.academic_semesters
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS academic_semesters_admin_write ON public.academic_semesters;
CREATE POLICY academic_semesters_admin_write ON public.academic_semesters
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

COMMIT;
