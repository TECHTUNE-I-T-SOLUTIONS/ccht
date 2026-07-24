-- Drop all auth.users triggers and rebuild a single clean signup trigger.
-- Run this in the Supabase SQL Editor.

BEGIN;

-- Remove every non-internal trigger attached to auth.users.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'auth'
      AND c.relname = 'users'
      AND NOT t.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', r.tgname);
  END LOOP;
END $$;

-- Remove the old signup function so we can recreate it cleanly.
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate a minimal trigger function that only writes to public.profiles
-- and the role-specific detail table.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_jamb TEXT;
BEGIN
  v_role := LOWER(COALESCE(NEW.raw_user_meta_data ->> 'role', 'student'));

  IF v_role = 'teacher' THEN
    v_role := 'lecturer';
  END IF;

  IF v_role NOT IN ('student', 'lecturer', 'admin', 'super_admin', 'aspirant') THEN
    v_role := 'student';
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    middle_name,
    phone,
    role,
    is_active
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'first_name', ''), ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'last_name', ''), ''),
    NULLIF(NEW.raw_user_meta_data ->> 'middle_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'phone', ''),
    v_role,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    middle_name = EXCLUDED.middle_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

  IF v_role = 'student' THEN
    INSERT INTO public.student_profiles (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  ELSIF v_role = 'lecturer' THEN
    INSERT INTO public.teacher_profiles (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  ELSIF v_role = 'aspirant' THEN
    v_jamb := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'jamb_reg_no', '')), '');
    INSERT INTO public.aspirant_profiles (profile_id, jamb_reg_no)
    VALUES (NEW.id, COALESCE(v_jamb, 'TEMP-PLACEHOLDER'))
    ON CONFLICT (profile_id) DO NOTHING;
  ELSE
    INSERT INTO public.admin_profiles (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate one canonical trigger.
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

COMMIT;
