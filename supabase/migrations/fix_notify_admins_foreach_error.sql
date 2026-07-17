-- Fix FOREACH expression null error in notify_admins_about_aspirant function
-- This error occurs when there are no admin profiles in the database

CREATE OR REPLACE FUNCTION public.notify_admins_about_aspirant(
  p_title text,
  p_message text,
  p_category text DEFAULT 'admissions',
  p_deep_link text DEFAULT NULL,
  p_priority text DEFAULT 'normal',
  p_created_by uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin uuid;
  v_admin_count integer;
BEGIN
  -- Check if any admins exist first
  SELECT COUNT(*) INTO v_admin_count FROM public.admin_profiles;
  
  -- Only proceed if admins exist
  IF v_admin_count > 0 THEN
    FOR v_admin IN
      SELECT profile_id FROM public.admin_profiles
    LOOP
      PERFORM public.create_admin_notification(
        v_admin, p_title, p_message, 'admissions', p_category, p_deep_link, p_priority, p_created_by
      );
    END LOOP;
  ELSE
    -- Log a warning if no admins exist but don't fail
    RAISE WARNING 'No admin profiles found to notify about aspirant action: %', p_title;
  END IF;
END;
$$;
