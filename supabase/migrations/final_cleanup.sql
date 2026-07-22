-- ============================================================
-- FINAL CLEANUP MIGRATION
-- 1. Add departments jsonb column (if not exists)
-- 2. Remove legacy signup_links tables (no longer needed)
-- 3. Ensure RLS policies work
-- ============================================================

-- ============================================================
-- 1. Add departments jsonb column for multiple dept support
-- ============================================================
ALTER TABLE public.teacher_profiles 
ADD COLUMN IF NOT EXISTS departments jsonb DEFAULT '[]'::jsonb;

-- Migrate existing single department data to jsonb array
UPDATE public.teacher_profiles 
SET departments = to_jsonb(ARRAY[department])
WHERE department IS NOT NULL AND department != '' 
  AND (departments IS NULL OR departments = '[]'::jsonb);

-- ============================================================
-- 2. Drop legacy tables (signup links no longer needed)
-- ============================================================
DROP TABLE IF EXISTS public.lecturer_signup_links CASCADE;
DROP TABLE IF EXISTS public.student_signup_links CASCADE;

-- ============================================================
-- 3. Ensure signup_settings RLS policies for admins
-- ============================================================
ALTER TABLE public.signup_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view signup settings" ON public.signup_settings;
DROP POLICY IF EXISTS "Only admins can update signup settings" ON public.signup_settings;
DROP POLICY IF EXISTS "Only admins can insert signup settings" ON public.signup_settings;

-- Recreate policies
CREATE POLICY "Anyone can view signup settings"
  ON public.signup_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can update signup settings"
  ON public.signup_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Only admins can insert signup settings"
  ON public.signup_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Ensure default settings exist
INSERT INTO public.signup_settings (signup_type, is_enabled)
VALUES ('lecturer', true), ('student', true)
ON CONFLICT (signup_type) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  updated_at = now();

-- ============================================================
-- 4. Ensure notification RLS policies for teacher_notifications
-- ============================================================
ALTER TABLE public.teacher_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view own notifications" ON public.teacher_notifications;
CREATE POLICY "Teachers can view own notifications"
  ON public.teacher_notifications FOR SELECT
  TO authenticated
  USING (
    teacher_id IN (SELECT profile_id FROM public.teacher_profiles WHERE profile_id = auth.uid())
  );

-- ============================================================
-- 5. Enable realtime for notifications (use DO block for safety)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'teacher_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_notifications;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'student_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.student_notifications;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'admin_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
  END IF;
END;
$$;
