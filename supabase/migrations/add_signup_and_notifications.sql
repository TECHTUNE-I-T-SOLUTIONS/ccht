-- ============================================================
-- COMPLETE SIGNUP AND NOTIFICATION SYSTEM
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. LECTURER SIGNUP LINKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lecturer_signup_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  access_code text NOT NULL UNIQUE,
  is_used boolean NOT NULL DEFAULT false,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lecturer_signup_links_access_code ON public.lecturer_signup_links(access_code);
CREATE INDEX IF NOT EXISTS idx_lecturer_signup_links_lecturer_id ON public.lecturer_signup_links(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_lecturer_signup_links_email ON public.lecturer_signup_links(email);

ALTER TABLE public.lecturer_signup_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to view signup links by access code"
  ON public.lecturer_signup_links FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to create signup links"
  ON public.lecturer_signup_links FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update signup links"
  ON public.lecturer_signup_links FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================
-- 2. STUDENT SIGNUP LINKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_signup_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  access_code text NOT NULL UNIQUE,
  is_used boolean NOT NULL DEFAULT false,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_signup_links_access_code ON public.student_signup_links(access_code);
CREATE INDEX IF NOT EXISTS idx_student_signup_links_student_id ON public.student_signup_links(student_id);
CREATE INDEX IF NOT EXISTS idx_student_signup_links_email ON public.student_signup_links(email);

ALTER TABLE public.student_signup_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to view student signup links by access code"
  ON public.student_signup_links FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to create student signup links"
  ON public.student_signup_links FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update student signup links"
  ON public.student_signup_links FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================
-- 3. SIGNUP SETTINGS TABLE (Controls whether signup is enabled)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.signup_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signup_type text NOT NULL UNIQUE CHECK (signup_type = ANY (ARRAY['lecturer'::text, 'student'::text])),
  is_enabled boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.signup_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view signup settings"
  ON public.signup_settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can update signup settings"
  ON public.signup_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert default settings
INSERT INTO public.signup_settings (signup_type, is_enabled)
VALUES ('lecturer', true), ('student', false)
ON CONFLICT (signup_type) DO NOTHING;

-- ============================================================
-- 4. NOTIFICATION TRIGGERS
-- ============================================================

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_notification_type text DEFAULT 'general',
  p_category text DEFAULT 'general',
  p_deep_link text DEFAULT NULL,
  p_priority text DEFAULT 'normal'
)
RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  -- Insert into appropriate notification table based on user role
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'lecturer') THEN
    INSERT INTO public.teacher_notifications (
      teacher_id, title, message, notification_type, category, deep_link
    ) VALUES (
      p_user_id, p_title, p_message, p_notification_type, p_category, p_deep_link
    ) RETURNING id INTO v_notification_id;
  ELSIF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND role = 'student') THEN
    INSERT INTO public.student_notifications (
      student_id, title, message, notification_type, category, deep_link
    ) VALUES (
      p_user_id, p_title, p_message, p_notification_type, p_category, p_deep_link
    ) RETURNING id INTO v_notification_id;
  ELSIF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND role IN ('admin', 'super_admin')) THEN
    INSERT INTO public.admin_notifications (
      admin_id, title, message, notification_type, category, deep_link, priority
    ) VALUES (
      p_user_id, p_title, p_message, p_notification_type, p_category, p_deep_link, p_priority
    ) RETURNING id INTO v_notification_id;
  END IF;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. TRIGGER FOR LECTURER SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_lecturer_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for the lecturer
  PERFORM create_notification(
    NEW.id,
    'Welcome to CCHT!',
    'Your lecturer account has been created successfully. You can now access the lecturer dashboard.',
    'account_created',
    'account',
    '/portal/lecturer/dashboard',
    'high'
  );
  
  -- Create notification for all admins
  INSERT INTO public.admin_notifications (admin_id, title, message, notification_type, category, deep_link)
  SELECT 
    p.id,
    'New Lecturer Signup',
    'A new lecturer has signed up: ' || NEW.first_name || ' ' || NEW.last_name || ' (' || NEW.email || ')',
    'new_signup',
    'user_management',
    '/admin/management/lecturers'
  FROM public.profiles p
  WHERE p.role IN ('admin', 'super_admin') AND p.is_active = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table for lecturer signups
DROP TRIGGER IF EXISTS trigger_lecturer_signup ON public.profiles;
CREATE TRIGGER trigger_lecturer_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'lecturer')
  EXECUTE FUNCTION public.handle_lecturer_signup();

-- ============================================================
-- 6. TRIGGER FOR STUDENT SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_student_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for the student
  PERFORM create_notification(
    NEW.id,
    'Welcome to CCHT!',
    'Your student account has been created successfully. You can now access the student portal.',
    'account_created',
    'account',
    '/portal/student/dashboard',
    'high'
  );
  
  -- Create notification for all admins
  INSERT INTO public.admin_notifications (admin_id, title, message, notification_type, category, deep_link)
  SELECT 
    p.id,
    'New Student Signup',
    'A new student has signed up: ' || NEW.first_name || ' ' || NEW.last_name || ' (' || NEW.email || ')',
    'new_signup',
    'user_management',
    '/admin/management/students'
  FROM public.profiles p
  WHERE p.role IN ('admin', 'super_admin') AND p.is_active = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table for student signups
DROP TRIGGER IF EXISTS trigger_student_signup ON public.profiles;
CREATE TRIGGER trigger_student_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'student')
  EXECUTE FUNCTION public.handle_student_signup();

-- ============================================================
-- 7. UPDATED_AT TRIGGERS FOR NEW TABLES
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_lecturer_signup_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lecturer_signup_links_updated_at
  BEFORE UPDATE ON public.lecturer_signup_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lecturer_signup_links_updated_at();

CREATE OR REPLACE FUNCTION public.update_student_signup_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_signup_links_updated_at
  BEFORE UPDATE ON public.student_signup_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_student_signup_links_updated_at();

CREATE OR REPLACE FUNCTION public.update_signup_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_signup_settings_updated_at
  BEFORE UPDATE ON public.signup_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_signup_settings_updated_at();

-- ============================================================
-- 8. RLS POLICIES FOR NOTIFICATION TABLES
-- ============================================================
ALTER TABLE public.teacher_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own notifications
CREATE POLICY "Teachers can view own notifications"
  ON public.teacher_notifications FOR SELECT
  TO authenticated
  USING (
    teacher_id IN (SELECT id FROM public.profiles WHERE id = auth.uid())
  );

-- Students can view their own notifications
CREATE POLICY "Students can view own notifications"
  ON public.student_notifications FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT profile_id FROM public.student_profiles WHERE profile_id = auth.uid())
  );

-- Admins can view their own notifications
CREATE POLICY "Admins can view own notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (
    admin_id IN (SELECT profile_id FROM public.admin_profiles WHERE profile_id = auth.uid())
  );

-- ============================================================
-- 9. ENABLE REALTIME FOR NOTIFICATIONS
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;