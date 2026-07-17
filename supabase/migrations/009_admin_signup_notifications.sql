-- ============================================================
-- Admin Signup Notifications and Staff ID Display
-- ============================================================

-- Function to create notification when admin profile is created
CREATE OR REPLACE FUNCTION notify_admin_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create welcome notification for the new admin
  INSERT INTO public.admin_notifications (
    admin_id,
    title,
    message,
    notification_type,
    category,
    priority,
    is_read
  ) VALUES (
    NEW.profile_id,
    'Welcome to CCHT Admin Portal',
    'Your admin account has been successfully created. Your Staff ID is: ' || NEW.staff_id || '. Please complete your profile setup and review your assigned permissions.',
    'welcome',
    'account',
    'high',
    false
  );

  -- Notify super admins about new admin signup
  INSERT INTO public.admin_notifications (
    admin_id,
    title,
    message,
    notification_type,
    category,
    priority,
    is_read,
    sent_by
  )
  SELECT 
    ap.profile_id,
    'New Admin Account Created',
    'A new admin account has been created with Staff ID: ' || NEW.staff_id || '. Department: ' || NEW.department || ', Designation: ' || NEW.designation,
    'admin_management',
    'admin',
    'normal',
    false,
    NEW.profile_id
  FROM public.admin_profiles ap
  WHERE ap.admin_scope = 'super'
    AND ap.profile_id != NEW.profile_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trg_notify_admin_signup ON public.admin_profiles;

-- Create trigger for admin signup notification
CREATE TRIGGER trg_notify_admin_signup
  AFTER INSERT ON public.admin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_signup();

-- Add comment for documentation
COMMENT ON FUNCTION notify_admin_on_signup IS 'Creates welcome notification for new admins and notifies super admins of new admin signups';

-- ============================================================
-- Ensure admin_profiles has all required fields
-- ============================================================

-- Check and add phone field to profiles if not exists (for admin signup)
-- Note: phone is in profiles table, not admin_profiles
-- This is just a comment to clarify the structure

-- ============================================================
-- Create view for admin dashboard with staff ID
-- ============================================================

-- Create or replace view for admin dashboard data
CREATE OR REPLACE VIEW admin_dashboard_view AS
SELECT 
  ap.profile_id,
  ap.staff_id,
  ap.department,
  ap.designation,
  ap.admin_scope,
  ap.can_manage_users,
  ap.can_manage_content,
  ap.can_manage_academics,
  ap.can_manage_finance,
  ap.created_at as admin_created_at,
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.middle_name,
  p.phone,
  p.avatar_url,
  p.is_active,
  p.last_seen_at,
  p.created_at as profile_created_at,
  p.updated_at as profile_updated_at
FROM public.admin_profiles ap
JOIN public.profiles p ON ap.profile_id = p.id;

COMMENT ON VIEW admin_dashboard_view IS 'View combining admin profile and profile data for dashboard display with staff ID';

-- ============================================================
-- Create function to get admin details with staff ID
-- ============================================================

CREATE OR REPLACE FUNCTION get_admin_with_staff_id(admin_uuid uuid)
RETURNS TABLE (
  profile_id uuid,
  staff_id text,
  email text,
  full_name text,
  department admin_department,
  designation admin_designation,
  admin_scope text,
  can_manage_users boolean,
  can_manage_content boolean,
  can_manage_academics boolean,
  can_manage_finance boolean,
  avatar_url text,
  is_active boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.profile_id,
    ap.staff_id,
    p.email,
    CONCAT(p.first_name, ' ', COALESCE(p.middle_name, ''), ' ', p.last_name) as full_name,
    ap.department,
    ap.designation,
    ap.admin_scope,
    ap.can_manage_users,
    ap.can_manage_content,
    ap.can_manage_academics,
    ap.can_manage_finance,
    p.avatar_url,
    p.is_active
  FROM public.admin_profiles ap
  JOIN public.profiles p ON ap.profile_id = p.id
  WHERE ap.profile_id = admin_uuid;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_admin_with_staff_id IS 'Returns admin details including staff ID for dashboard display';
