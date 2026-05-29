-- Phase 1: Comprehensive schema for CCHT Platform
-- Designed for Supabase Auth + strict role separation + RLS.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- Utility functions
-- ============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Core identity model (auth.users extension)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  middle_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin', 'super_admin')),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() IN ('admin', 'super_admin'), FALSE);
$$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'teacher', FALSE);
$$;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'student', FALSE);
$$;

CREATE TABLE IF NOT EXISTS public.student_profiles (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_number TEXT UNIQUE,
  matric_number TEXT UNIQUE,
  admission_session TEXT,
  admission_date DATE,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  blood_group TEXT,
  genotype TEXT,
  state_of_origin TEXT,
  local_government_area TEXT,
  nationality TEXT DEFAULT 'Nigerian',
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_email TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  current_level TEXT,
  admission_status TEXT DEFAULT 'active' CHECK (admission_status IN ('active', 'suspended', 'graduated', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teacher_profiles (
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

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  staff_id TEXT UNIQUE,
  department TEXT,
  designation TEXT,
  admin_scope TEXT DEFAULT 'operations' CHECK (admin_scope IN ('operations', 'academics', 'finance', 'super')),
  can_manage_users BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_content BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_academics BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_finance BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Academic structure
-- ============================================
CREATE TABLE IF NOT EXISTS public.academic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  starts_on DATE,
  ends_on DATE,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.academic_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  term_name TEXT NOT NULL CHECK (term_name IN ('First Term', 'Second Term', 'Third Term')),
  starts_on DATE,
  ends_on DATE,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, term_name)
);

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Programs and courses
-- ============================================
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  overview TEXT,
  entry_requirements TEXT,
  career_prospects TEXT,
  duration_months INTEGER NOT NULL,
  duration_unit TEXT NOT NULL CHECK (duration_unit IN ('months', 'years')),
  tuition_fee NUMERIC(10, 2) NOT NULL,
  curriculum TEXT,
  level TEXT NOT NULL CHECK (level IN ('certificate', 'diploma', 'degree')),
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  max_students INTEGER,
  admission_open BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  credit_units INTEGER DEFAULT 1,
  level TEXT,
  semester INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(profile_id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  term_id UUID REFERENCES public.academic_terms(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, teacher_id, session_id, term_id)
);

-- ============================================
-- Enrollment, assessment, and result domain
-- ============================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE RESTRICT,
  session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  enrollment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_graduation_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'deferred', 'withdrawn')),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, program_id)
);

CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES public.teacher_profiles(profile_id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  term_id UUID REFERENCES public.academic_terms(id) ON DELETE SET NULL,
  continuous_assessment NUMERIC(5, 2) DEFAULT 0 CHECK (continuous_assessment >= 0 AND continuous_assessment <= 40),
  exam_score NUMERIC(5, 2) DEFAULT 0 CHECK (exam_score >= 0 AND exam_score <= 60),
  total_score NUMERIC(5, 2) GENERATED ALWAYS AS (COALESCE(continuous_assessment, 0) + COALESCE(exam_score, 0)) STORED,
  grade TEXT CHECK (grade IN ('A', 'B', 'C', 'D', 'E', 'F')),
  score_status TEXT NOT NULL DEFAULT 'draft' CHECK (score_status IN ('draft', 'submitted', 'approved', 'published')),
  score_entered_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.admin_profiles(profile_id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, course_id, session_id, term_id)
);

CREATE TABLE IF NOT EXISTS public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
  course_name TEXT NOT NULL,
  score NUMERIC(5, 2) CHECK (score >= 0 AND score <= 100),
  grade TEXT CHECK (grade IN ('A', 'B', 'C', 'D', 'E', 'F')),
  semester INTEGER,
  academic_year TEXT,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES public.admin_profiles(profile_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.result_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  term_id UUID REFERENCES public.academic_terms(id) ON DELETE SET NULL,
  published_by UUID REFERENCES public.admin_profiles(profile_id) ON DELETE SET NULL,
  publication_status TEXT NOT NULL DEFAULT 'published' CHECK (publication_status IN ('published', 'unpublished')),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- ============================================
-- Content domain
-- ============================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  featured_image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  event_end_date TIMESTAMPTZ,
  location TEXT,
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  featured_image_url TEXT,
  registration_link TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'students', 'teachers', 'admins')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'archived')),
  handled_by UUID REFERENCES public.admin_profiles(profile_id) ON DELETE SET NULL,
  handled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Fees, invoicing, and payments
-- ============================================
CREATE TABLE IF NOT EXISTS public.fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('tuition', 'registration', 'exam', 'library', 'other')),
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT,
  due_in_days INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  term_id UUID REFERENCES public.academic_terms(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE,
  description TEXT,
  amount_due NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_paid', 'paid', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  payment_method TEXT CHECK (payment_method IN ('paystack', 'bank_transfer', 'cash')),
  paystack_reference TEXT UNIQUE,
  paystack_access_code TEXT,
  provider_transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'abandoned', 'refunded')),
  description TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  provider TEXT DEFAULT 'paystack',
  provider_reference TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  signature TEXT,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Role-specific notification centers
-- ============================================
CREATE TABLE IF NOT EXISTS public.student_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.student_profiles(profile_id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS public.teacher_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(profile_id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admin_profiles(profile_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'general',
  category TEXT,
  deep_link TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  sent_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- School settings and audit
-- ============================================
CREATE TABLE IF NOT EXISTS public.school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  value_json JSONB,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Apply updated_at trigger to mutable tables
-- ============================================
DO $$
DECLARE
  table_name TEXT;
  tables TEXT[] := ARRAY[
    'profiles','student_profiles','teacher_profiles','admin_profiles',
    'academic_sessions','academic_terms','departments',
    'programs','courses','enrollments','assessments','results',
    'blog_posts','events','notices','announcements','contact_messages',
    'fees','invoices','payments',
    'student_notifications','teacher_notifications','admin_notifications'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I', table_name, table_name);
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', table_name, table_name);
  END LOOP;
END $$;

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_student_profiles_student_number ON public.student_profiles(student_number);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_employee_number ON public.teacher_profiles(employee_number);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_staff_id ON public.admin_profiles(staff_id);

CREATE INDEX IF NOT EXISTS idx_programs_slug ON public.programs(slug);
CREATE INDEX IF NOT EXISTS idx_programs_active ON public.programs(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_program ON public.courses(program_id);
CREATE INDEX IF NOT EXISTS idx_courses_code ON public.courses(code);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_program ON public.enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_assessments_student ON public.assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_assessments_course ON public.assessments(course_id);
CREATE INDEX IF NOT EXISTS idx_results_student ON public.results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_published ON public.results(published);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_notices_slug ON public.notices(slug);
CREATE INDEX IF NOT EXISTS idx_notices_published ON public.notices(is_published);

CREATE INDEX IF NOT EXISTS idx_invoices_student ON public.invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_payment_events_reference ON public.payment_events(provider_reference);
CREATE INDEX IF NOT EXISTS idx_payment_events_processed ON public.payment_events(processed);

CREATE INDEX IF NOT EXISTS idx_student_notifications_student ON public.student_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_notifications_teacher ON public.teacher_notifications(teacher_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin ON public.admin_notifications(admin_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_name, entity_id);

-- ============================================
-- Enable RLS everywhere
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.result_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to allow repeatable migration runs
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- ============================================
-- RLS Policies
-- ============================================

-- Profiles
CREATE POLICY profiles_select_own_or_admin ON public.profiles
FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY profiles_insert_own ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_own_or_admin ON public.profiles
FOR UPDATE USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY profiles_delete_admin_only ON public.profiles
FOR DELETE USING (public.is_admin());

-- Role-specific profile tables
CREATE POLICY student_profiles_select ON public.student_profiles
FOR SELECT USING (profile_id = auth.uid() OR public.is_admin() OR public.is_teacher());

CREATE POLICY student_profiles_modify_self_or_admin ON public.student_profiles
FOR ALL USING (profile_id = auth.uid() OR public.is_admin())
WITH CHECK (profile_id = auth.uid() OR public.is_admin());

CREATE POLICY teacher_profiles_select ON public.teacher_profiles
FOR SELECT USING (profile_id = auth.uid() OR public.is_admin());

CREATE POLICY teacher_profiles_modify_self_or_admin ON public.teacher_profiles
FOR ALL USING (profile_id = auth.uid() OR public.is_admin())
WITH CHECK (profile_id = auth.uid() OR public.is_admin());

CREATE POLICY admin_profiles_select_admin_only ON public.admin_profiles
FOR SELECT USING (profile_id = auth.uid() OR public.is_admin());

CREATE POLICY admin_profiles_modify_admin_only ON public.admin_profiles
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Academic structure read for authenticated users, write for admins
CREATE POLICY academic_sessions_read_authenticated ON public.academic_sessions
FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY academic_sessions_admin_write ON public.academic_sessions
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY academic_terms_read_authenticated ON public.academic_terms
FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY academic_terms_admin_write ON public.academic_terms
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY departments_read_authenticated ON public.departments
FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY departments_admin_write ON public.departments
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY programs_select_public_active ON public.programs
FOR SELECT USING (is_active = TRUE);
CREATE POLICY programs_admin_write ON public.programs
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY courses_read_authenticated ON public.courses
FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);
CREATE POLICY courses_teacher_admin_write ON public.courses
FOR ALL USING (public.is_teacher() OR public.is_admin())
WITH CHECK (public.is_teacher() OR public.is_admin());

CREATE POLICY course_assignments_teacher_admin ON public.course_teacher_assignments
FOR ALL USING (public.is_teacher() OR public.is_admin())
WITH CHECK (public.is_teacher() OR public.is_admin());

-- Enrollment, assessments, results
CREATE POLICY enrollments_select ON public.enrollments
FOR SELECT USING (
  student_id = auth.uid()
  OR public.is_teacher()
  OR public.is_admin()
);
CREATE POLICY enrollments_admin_write ON public.enrollments
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY assessments_select ON public.assessments
FOR SELECT USING (
  student_id = auth.uid()
  OR teacher_id = auth.uid()
  OR public.is_admin()
);
CREATE POLICY assessments_teacher_admin_write ON public.assessments
FOR ALL USING (public.is_teacher() OR public.is_admin())
WITH CHECK (public.is_teacher() OR public.is_admin());

CREATE POLICY results_select ON public.results
FOR SELECT USING (
  student_id = auth.uid()
  OR public.is_teacher()
  OR public.is_admin()
);
CREATE POLICY results_teacher_admin_write ON public.results
FOR ALL USING (public.is_teacher() OR public.is_admin())
WITH CHECK (public.is_teacher() OR public.is_admin());

CREATE POLICY result_publications_admin_write ON public.result_publications
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Content
CREATE POLICY blog_posts_select_published ON public.blog_posts
FOR SELECT USING (status = 'published' OR public.is_admin() OR public.is_teacher());
CREATE POLICY blog_posts_teacher_admin_write ON public.blog_posts
FOR ALL USING (public.is_teacher() OR public.is_admin())
WITH CHECK (public.is_teacher() OR public.is_admin());

CREATE POLICY events_select_published ON public.events
FOR SELECT USING (is_published = TRUE OR public.is_admin() OR public.is_teacher());
CREATE POLICY events_teacher_admin_write ON public.events
FOR ALL USING (public.is_teacher() OR public.is_admin())
WITH CHECK (public.is_teacher() OR public.is_admin());

CREATE POLICY notices_select_published ON public.notices
FOR SELECT USING (is_published = TRUE OR public.is_admin() OR public.is_teacher());
CREATE POLICY notices_teacher_admin_write ON public.notices
FOR ALL USING (public.is_teacher() OR public.is_admin())
WITH CHECK (public.is_teacher() OR public.is_admin());

CREATE POLICY announcements_select_published ON public.announcements
FOR SELECT USING (is_published = TRUE OR public.is_admin() OR public.is_teacher());
CREATE POLICY announcements_admin_write ON public.announcements
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY contact_messages_admin_only ON public.contact_messages
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Fees and payment
CREATE POLICY fees_select_all_active ON public.fees
FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY fees_admin_write ON public.fees
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY invoices_select_own_or_admin ON public.invoices
FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY invoices_admin_write ON public.invoices
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY payments_select_own_or_admin ON public.payments
FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY payments_insert_own_or_admin ON public.payments
FOR INSERT WITH CHECK (student_id = auth.uid() OR public.is_admin());
CREATE POLICY payments_admin_update_delete ON public.payments
FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY payments_admin_delete ON public.payments
FOR DELETE USING (public.is_admin());

CREATE POLICY payment_events_admin_only ON public.payment_events
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Notifications (separate by role)
CREATE POLICY student_notifications_select_own ON public.student_notifications
FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY student_notifications_update_own ON public.student_notifications
FOR UPDATE USING (student_id = auth.uid() OR public.is_admin())
WITH CHECK (student_id = auth.uid() OR public.is_admin());
CREATE POLICY student_notifications_insert_by_teacher_admin ON public.student_notifications
FOR INSERT WITH CHECK (public.is_teacher() OR public.is_admin());
CREATE POLICY student_notifications_delete_admin ON public.student_notifications
FOR DELETE USING (public.is_admin());

CREATE POLICY teacher_notifications_select_own ON public.teacher_notifications
FOR SELECT USING (teacher_id = auth.uid() OR public.is_admin());
CREATE POLICY teacher_notifications_update_own ON public.teacher_notifications
FOR UPDATE USING (teacher_id = auth.uid() OR public.is_admin())
WITH CHECK (teacher_id = auth.uid() OR public.is_admin());
CREATE POLICY teacher_notifications_insert_by_admin ON public.teacher_notifications
FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY teacher_notifications_delete_admin ON public.teacher_notifications
FOR DELETE USING (public.is_admin());

CREATE POLICY admin_notifications_select_own ON public.admin_notifications
FOR SELECT USING (admin_id = auth.uid() OR public.is_admin());
CREATE POLICY admin_notifications_update_own ON public.admin_notifications
FOR UPDATE USING (admin_id = auth.uid() OR public.is_admin())
WITH CHECK (admin_id = auth.uid() OR public.is_admin());
CREATE POLICY admin_notifications_insert_admin ON public.admin_notifications
FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY admin_notifications_delete_admin ON public.admin_notifications
FOR DELETE USING (public.is_admin());

-- Settings and audit
CREATE POLICY school_settings_public_read ON public.school_settings
FOR SELECT USING (is_public = TRUE OR public.is_admin());
CREATE POLICY school_settings_admin_write ON public.school_settings
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY audit_logs_admin_read ON public.audit_logs
FOR SELECT USING (public.is_admin());
CREATE POLICY audit_logs_system_insert ON public.audit_logs
FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================
-- Notification automation (DB-side)
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_student(
  p_student_id UUID,
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
  INSERT INTO public.student_notifications (
    student_id, title, message, notification_type, category, deep_link, sent_by
  )
  VALUES (
    p_student_id, p_title, p_message, p_type, p_category, p_deep_link, p_sent_by
  )
  ON CONFLICT DO NOTHING;
END;
$$;

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
  INSERT INTO public.teacher_notifications (
    teacher_id, title, message, notification_type, category, deep_link, sent_by
  )
  SELECT
    tp.profile_id, p_title, p_message, p_type, p_category, p_deep_link, p_sent_by
  FROM public.teacher_profiles tp;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admins(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'system',
  p_category TEXT DEFAULT NULL,
  p_deep_link TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal',
  p_sent_by UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (
    admin_id, title, message, notification_type, category, deep_link, priority, sent_by
  )
  SELECT
    ap.profile_id, p_title, p_message, p_type, p_category, p_deep_link, p_priority, p_sent_by
  FROM public.admin_profiles ap;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_all_students(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'announcement',
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
  INSERT INTO public.student_notifications (
    student_id, title, message, notification_type, category, deep_link, sent_by
  )
  SELECT
    sp.profile_id, p_title, p_message, p_type, p_category, p_deep_link, p_sent_by
  FROM public.student_profiles sp;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_notification_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'enrollments' THEN
    IF TG_OP = 'INSERT' THEN
      PERFORM public.notify_student(
        NEW.student_id,
        'Enrollment Confirmed',
        'Your enrollment record has been created successfully.',
        'enrollment',
        'academics',
        '/portal/student/courses',
        NEW.student_id
      );
      PERFORM public.notify_admins(
        'New Enrollment Created',
        'A new student enrollment was created and requires review.',
        'enrollment',
        'academics',
        '/portal/admin/dashboard',
        'normal',
        NEW.student_id
      );
    ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
      PERFORM public.notify_student(
        NEW.student_id,
        'Enrollment Status Updated',
        'Your enrollment status changed to: ' || NEW.status || '.',
        'enrollment',
        'academics',
        '/portal/student/courses',
        auth.uid()
      );
      PERFORM public.notify_admins(
        'Enrollment Status Changed',
        'Enrollment status changed to: ' || NEW.status || '.',
        'enrollment',
        'academics',
        '/portal/admin/dashboard',
        'normal',
        auth.uid()
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'assessments' THEN
    IF TG_OP = 'INSERT' THEN
      PERFORM public.notify_student(
        NEW.student_id,
        'New Assessment Score Recorded',
        'A new score has been entered for one of your courses.',
        'result',
        'academics',
        '/portal/student/results',
        NEW.teacher_id
      );
      PERFORM public.notify_admins(
        'Assessment Score Entered',
        'A teacher entered assessment scores for review.',
        'result',
        'academics',
        '/portal/admin/dashboard',
        'normal',
        NEW.teacher_id
      );
    ELSIF TG_OP = 'UPDATE' AND NEW.score_status IS DISTINCT FROM OLD.score_status THEN
      PERFORM public.notify_student(
        NEW.student_id,
        'Assessment Status Updated',
        'Your assessment status changed to: ' || NEW.score_status || '.',
        'result',
        'academics',
        '/portal/student/results',
        auth.uid()
      );
      PERFORM public.notify_teachers(
        'Assessment Workflow Update',
        'Assessment status changed to: ' || NEW.score_status || '.',
        'result',
        'academics',
        '/portal/teacher/dashboard',
        auth.uid()
      );
      PERFORM public.notify_admins(
        'Assessment Status Changed',
        'An assessment status changed to: ' || NEW.score_status || '.',
        'result',
        'academics',
        '/portal/admin/dashboard',
        'normal',
        auth.uid()
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'results' THEN
    IF TG_OP = 'INSERT' THEN
      PERFORM public.notify_student(
        NEW.student_id,
        'Result Entry Created',
        'A result entry was created for your academic record.',
        'result',
        'academics',
        '/portal/student/results',
        auth.uid()
      );
    ELSIF TG_OP = 'UPDATE' AND NEW.published IS TRUE AND (OLD.published IS DISTINCT FROM TRUE) THEN
      PERFORM public.notify_student(
        NEW.student_id,
        'Result Published',
        'A new result has been published. Open your results dashboard to view details.',
        'result',
        'academics',
        '/portal/student/results',
        NEW.published_by
      );
      PERFORM public.notify_teachers(
        'Result Publication Notice',
        'A result was published for students in your academic unit.',
        'result',
        'academics',
        '/portal/teacher/dashboard',
        NEW.published_by
      );
      PERFORM public.notify_admins(
        'Result Published',
        'A result publication event was completed.',
        'result',
        'academics',
        '/portal/admin/dashboard',
        'normal',
        NEW.published_by
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'result_publications' THEN
    PERFORM public.notify_teachers(
      'Term Result Publication',
      'A result publication batch was executed.',
      'result',
      'academics',
      '/portal/teacher/dashboard',
      NEW.published_by
    );
    PERFORM public.notify_admins(
      'Result Publication Batch Completed',
      'Result publication process completed for one batch.',
      'result',
      'academics',
      '/portal/admin/dashboard',
      'high',
      NEW.published_by
    );
  ELSIF TG_TABLE_NAME = 'payments' THEN
    IF TG_OP = 'INSERT' THEN
      PERFORM public.notify_student(
        NEW.student_id,
        'Payment Initiated',
        'Your payment request was created with status: ' || NEW.status || '.',
        'payment',
        'finance',
        '/portal/student/payments',
        NEW.student_id
      );
      PERFORM public.notify_admins(
        'New Payment Attempt',
        'A payment was initiated and requires monitoring.',
        'payment',
        'finance',
        '/portal/admin/payments',
        'normal',
        NEW.student_id
      );
    ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
      PERFORM public.notify_student(
        NEW.student_id,
        'Payment Status Updated',
        'Your payment status changed to: ' || NEW.status || '.',
        'payment',
        'finance',
        '/portal/student/payments',
        auth.uid()
      );
      PERFORM public.notify_admins(
        'Payment Status Changed',
        'Payment status changed to: ' || NEW.status || '.',
        'payment',
        'finance',
        '/portal/admin/payments',
        CASE WHEN NEW.status IN ('failed', 'refunded') THEN 'high' ELSE 'normal' END,
        auth.uid()
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'payment_events' THEN
    PERFORM public.notify_admins(
      'Payment Webhook Event Received',
      'Payment event received: ' || NEW.event_type || '.',
      'payment',
      'finance',
      '/portal/admin/payments',
      CASE WHEN NEW.processed IS FALSE THEN 'high' ELSE 'normal' END,
      auth.uid()
    );
  ELSIF TG_TABLE_NAME = 'blog_posts' THEN
    IF TG_OP = 'INSERT' THEN
      PERFORM public.notify_admins(
        'New Blog Draft Created',
        'A new blog draft has been created.',
        'content',
        'communications',
        '/portal/admin/blog',
        'normal',
        NEW.author_id
      );
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'published' AND NEW.status IS DISTINCT FROM OLD.status THEN
      PERFORM public.notify_all_students(
        'New Blog Update',
        'A new blog post is now live: ' || NEW.title,
        'content',
        'communications',
        '/blog',
        NEW.author_id
      );
      PERFORM public.notify_teachers(
        'New Blog Update',
        'A new blog post is now live: ' || NEW.title,
        'content',
        'communications',
        '/blog',
        NEW.author_id
      );
      PERFORM public.notify_admins(
        'Blog Post Published',
        'A blog post was published: ' || NEW.title,
        'content',
        'communications',
        '/portal/admin/blog',
        'normal',
        NEW.author_id
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'events' THEN
    IF TG_OP = 'UPDATE' AND NEW.is_published IS TRUE AND (OLD.is_published IS DISTINCT FROM TRUE) THEN
      PERFORM public.notify_all_students(
        'New School Event',
        'A new event has been published: ' || NEW.title,
        'event',
        'communications',
        '/events',
        NEW.organizer_id
      );
      PERFORM public.notify_teachers(
        'New School Event',
        'A new event has been published: ' || NEW.title,
        'event',
        'communications',
        '/events',
        NEW.organizer_id
      );
      PERFORM public.notify_admins(
        'Event Published',
        'An event is now published: ' || NEW.title,
        'event',
        'communications',
        '/portal/admin/dashboard',
        'normal',
        NEW.organizer_id
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'notices' THEN
    IF TG_OP = 'UPDATE' AND NEW.is_published IS TRUE AND (OLD.is_published IS DISTINCT FROM TRUE) THEN
      PERFORM public.notify_all_students(
        'New Notice',
        NEW.title,
        'notice',
        'communications',
        '/events',
        NEW.created_by
      );
      PERFORM public.notify_teachers(
        'New Notice',
        NEW.title,
        'notice',
        'communications',
        '/events',
        NEW.created_by
      );
      PERFORM public.notify_admins(
        'Notice Published',
        'A notice was published: ' || NEW.title,
        'notice',
        'communications',
        '/portal/admin/dashboard',
        'normal',
        NEW.created_by
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'contact_messages' THEN
    IF TG_OP = 'INSERT' THEN
      PERFORM public.notify_admins(
        'New Contact Message',
        'A new inquiry was submitted from the contact form.',
        'contact',
        'communications',
        '/portal/admin/dashboard',
        'normal',
        NULL
      );
    ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
      PERFORM public.notify_admins(
        'Contact Message Status Updated',
        'Contact message status is now: ' || NEW.status || '.',
        'contact',
        'communications',
        '/portal/admin/dashboard',
        'normal',
        NEW.handled_by
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_enrollments ON public.enrollments;
CREATE TRIGGER trg_notify_enrollments
AFTER INSERT OR UPDATE ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.handle_notification_events();

DROP TRIGGER IF EXISTS trg_notify_assessments ON public.assessments;
CREATE TRIGGER trg_notify_assessments
AFTER INSERT OR UPDATE ON public.assessments
FOR EACH ROW EXECUTE FUNCTION public.handle_notification_events();

DROP TRIGGER IF EXISTS trg_notify_results ON public.results;
CREATE TRIGGER trg_notify_results
AFTER INSERT OR UPDATE ON public.results
FOR EACH ROW EXECUTE FUNCTION public.handle_notification_events();

DROP TRIGGER IF EXISTS trg_notify_result_publications ON public.result_publications;
CREATE TRIGGER trg_notify_result_publications
AFTER INSERT ON public.result_publications
FOR EACH ROW EXECUTE FUNCTION public.handle_notification_events();

DROP TRIGGER IF EXISTS trg_notify_payments ON public.payments;
CREATE TRIGGER trg_notify_payments
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.handle_notification_events();

DROP TRIGGER IF EXISTS trg_notify_payment_events ON public.payment_events;
CREATE TRIGGER trg_notify_payment_events
AFTER INSERT ON public.payment_events
FOR EACH ROW EXECUTE FUNCTION public.handle_notification_events();

DROP TRIGGER IF EXISTS trg_notify_blog_posts ON public.blog_posts;
CREATE TRIGGER trg_notify_blog_posts
AFTER INSERT OR UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.handle_notification_events();

DROP TRIGGER IF EXISTS trg_notify_events ON public.events;
CREATE TRIGGER trg_notify_events
AFTER UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.handle_notification_events();

DROP TRIGGER IF EXISTS trg_notify_notices ON public.notices;
CREATE TRIGGER trg_notify_notices
AFTER UPDATE ON public.notices
FOR EACH ROW EXECUTE FUNCTION public.handle_notification_events();

DROP TRIGGER IF EXISTS trg_notify_contact_messages ON public.contact_messages;
CREATE TRIGGER trg_notify_contact_messages
AFTER INSERT OR UPDATE ON public.contact_messages
FOR EACH ROW EXECUTE FUNCTION public.handle_notification_events();

-- ============================================
-- Supabase Auth hook: auto-create profile and role row
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := LOWER(COALESCE(new.raw_user_meta_data ->> 'role', 'student'));
  IF v_role NOT IN ('student', 'teacher', 'admin', 'super_admin') THEN
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
  ELSIF v_role = 'teacher' THEN
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
