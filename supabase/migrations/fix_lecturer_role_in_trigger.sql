-- Fix the handle_new_user trigger to keep lecturer role names aligned with the app.
-- The public schema stores 'lecturer' in profiles.role, while the legacy detail table
-- is still named teacher_profiles for compatibility.

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
    INSERT INTO public.teacher_profiles (profile_id)
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
