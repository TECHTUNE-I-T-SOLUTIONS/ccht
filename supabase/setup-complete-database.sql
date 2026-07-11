-- ============================================================
-- CCHT COMPLETE DATABASE SETUP
-- Run this file in Supabase SQL Editor to set up everything
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  first_name text,
  last_name text,
  middle_name text,
  phone text,
  role text NOT NULL DEFAULT 'student'::text CHECK (role = ANY (ARRAY['student'::text, 'lecturer'::text, 'admin'::text, 'super_admin'::text, 'aspirant'::text])),
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  last_seen_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  profile_photo_bucket text NOT NULL DEFAULT 'profile-photos'::text,
  profile_photo_path text UNIQUE,
  profile_photo_mime_type text,
  profile_photo_uploaded_by uuid,
  profile_photo_uploaded_at timestamp with time zone,
  media_provider text NOT NULL DEFAULT 'cloudinary'::text,
  stage text DEFAULT 'signup'::text,
  matric_number text UNIQUE,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT profiles_profile_photo_uploaded_by_fkey FOREIGN KEY (profile_photo_uploaded_by) REFERENCES public.profiles(id)
);

-- ============================================================
-- 2. STUDENT PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_profiles (
  profile_id uuid NOT NULL,
  student_number text UNIQUE,
  matric_number text UNIQUE,
  admission_session text,
  admission_date date,
  date_of_birth date,
  gender text CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text, 'prefer_not_to_say'::text])),
  blood_group text,
  genotype text,
  state_of_origin text,
  local_government_area text,
  nationality text DEFAULT 'Nigerian'::text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  emergency_contact_name text,
  emergency_contact_phone text,
  current_level text,
  admission_status text DEFAULT 'active'::text CHECK (admission_status = ANY (ARRAY['active'::text, 'suspended'::text, 'graduated'::text, 'withdrawn'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT student_profiles_pkey PRIMARY KEY (profile_id),
  CONSTRAINT student_profiles_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- ============================================================
-- 3. ADMIN PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  profile_id uuid NOT NULL,
  staff_id text UNIQUE,
  department text,
  designation text,
  admin_scope text DEFAULT 'operations'::text CHECK (admin_scope = ANY (ARRAY['operations'::text, 'academics'::text, 'finance'::text, 'super'::text])),
  can_manage_users boolean NOT NULL DEFAULT false,
  can_manage_content boolean NOT NULL DEFAULT false,
  can_manage_academics boolean NOT NULL DEFAULT false,
  can_manage_finance boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_profiles_pkey PRIMARY KEY (profile_id),
  CONSTRAINT admin_profiles_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- ============================================================
-- 4. ACADEMIC SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.academic_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  starts_on date,
  ends_on date,
  is_current boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT academic_sessions_pkey PRIMARY KEY (id)
);

-- ============================================================
-- 5. DEPARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT departments_pkey PRIMARY KEY (id)
);

-- ============================================================
-- 6. PROGRAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  overview text,
  entry_requirements text,
  career_prospects text,
  duration_months integer NOT NULL,
  duration_unit text NOT NULL CHECK (duration_unit = ANY (ARRAY['months'::text, 'years'::text])),
  tuition_fee numeric NOT NULL,
  curriculum text,
  level text NOT NULL CHECK (level = ANY (ARRAY['certificate'::text, 'diploma'::text, 'degree'::text])),
  department_id uuid,
  max_students integer,
  admission_open boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT programs_pkey PRIMARY KEY (id),
  CONSTRAINT programs_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id)
);

-- ============================================================
-- 7. COURSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid,
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  credit_units integer DEFAULT 1,
  level text,
  semester integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id)
);

-- ============================================================
-- 8. ACADEMIC SEMESTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.academic_semesters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  semester_name text NOT NULL CHECK (semester_name = ANY (ARRAY['First Semester'::text, 'Second Semester'::text])),
  starts_on date,
  ends_on date,
  is_current boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT academic_semesters_pkey PRIMARY KEY (id),
  CONSTRAINT academic_semesters_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.academic_sessions(id)
);

-- ============================================================
-- 9. COURSE TEACHER ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.course_teacher_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  session_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  semester_id uuid,
  CONSTRAINT course_teacher_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT course_teacher_assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT course_teacher_assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id),
  CONSTRAINT course_teacher_assignments_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.academic_sessions(id),
  CONSTRAINT course_teacher_assignments_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.academic_semesters(id)
);

-- ============================================================
-- 10. ENROLLMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  program_id uuid NOT NULL,
  session_id uuid,
  enrollment_date timestamp with time zone NOT NULL DEFAULT now(),
  expected_graduation_date date,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'dropped'::text, 'deferred'::text, 'withdrawn'::text])),
  remarks text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT enrollments_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id),
  CONSTRAINT enrollments_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.academic_sessions(id)
);

-- ============================================================
-- 11. ASSESSMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL,
  student_id uuid NOT NULL,
  course_id uuid,
  teacher_id uuid,
  session_id uuid,
  exam_score numeric DEFAULT 0 CHECK (exam_score >= 0::numeric AND exam_score <= 60::numeric),
  grade text CHECK (grade = ANY (ARRAY['A'::text, 'B'::text, 'C'::text, 'D'::text, 'E'::text, 'F'::text])),
  score_status text NOT NULL DEFAULT 'draft'::text CHECK (score_status = ANY (ARRAY['draft'::text, 'submitted'::text, 'approved'::text, 'published'::text])),
  score_entered_at timestamp with time zone,
  approved_by uuid,
  approved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  semester_id uuid,
  ca_1 numeric DEFAULT 0 CHECK (ca_1 >= 0::numeric AND ca_1 <= 15::numeric),
  ca_2 numeric DEFAULT 0 CHECK (ca_2 >= 0::numeric AND ca_2 <= 15::numeric),
  assignments numeric DEFAULT 0 CHECK (assignments >= 0::numeric AND assignments <= 10::numeric),
  continuous_assessment numeric DEFAULT ((COALESCE(ca_1, (0)::numeric) + COALESCE(ca_2, (0)::numeric)) + COALESCE(assignments, (0)::numeric)),
  total_score numeric DEFAULT (((COALESCE(ca_1, (0)::numeric) + COALESCE(ca_2, (0)::numeric)) + COALESCE(assignments, (0)::numeric)) + COALESCE(exam_score, (0)::numeric)),
  CONSTRAINT assessments_pkey PRIMARY KEY (id),
  CONSTRAINT assessments_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id),
  CONSTRAINT assessments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT assessments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT assessments_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.academic_sessions(id),
  CONSTRAINT assessments_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.admin_profiles(profile_id),
  CONSTRAINT assessments_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.academic_semesters(id)
);

-- ============================================================
-- 12. RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  enrollment_id uuid NOT NULL,
  assessment_id uuid,
  course_name text NOT NULL,
  score numeric CHECK (score >= 0::numeric AND score <= 100::numeric),
  grade text CHECK (grade = ANY (ARRAY['A'::text, 'B'::text, 'C'::text, 'D'::text, 'E'::text, 'F'::text])),
  semester integer,
  academic_year text,
  published boolean NOT NULL DEFAULT false,
  published_at timestamp with time zone,
  published_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT results_pkey PRIMARY KEY (id),
  CONSTRAINT results_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT results_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id),
  CONSTRAINT results_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id),
  CONSTRAINT results_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.admin_profiles(profile_id)
);

-- ============================================================
-- 13. RESULT PUBLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.result_publications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL,
  session_id uuid,
  published_by uuid,
  publication_status text NOT NULL DEFAULT 'published'::text CHECK (publication_status = ANY (ARRAY['published'::text, 'unpublished'::text])),
  published_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  semester_id uuid,
  CONSTRAINT result_publications_pkey PRIMARY KEY (id),
  CONSTRAINT result_publications_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id),
  CONSTRAINT result_publications_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.academic_sessions(id),
  CONSTRAINT result_publications_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.admin_profiles(profile_id),
  CONSTRAINT result_publications_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.academic_semesters(id)
);

-- ============================================================
-- 14. BLOG POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  author_id uuid,
  featured_image_url text,
  tags text[] DEFAULT '{}'::text[],
  seo_title text,
  seo_description text,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'review'::text, 'published'::text, 'archived'::text])),
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT blog_posts_pkey PRIMARY KEY (id),
  CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);

-- ============================================================
-- 15. EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  event_date timestamp with time zone NOT NULL,
  event_end_date timestamp with time zone,
  location text,
  organizer_id uuid,
  featured_image_url text,
  registration_link text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.profiles(id)
);

-- ============================================================
-- 16. NOTICES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  audience text NOT NULL DEFAULT 'all'::text CHECK (audience = ANY (ARRAY['all'::text, 'students'::text, 'teachers'::text, 'admins'::text])),
  created_by uuid,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notices_pkey PRIMARY KEY (id),
  CONSTRAINT notices_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- ============================================================
-- 17. ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_by uuid,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT announcements_pkey PRIMARY KEY (id),
  CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- ============================================================
-- 18. CONTACT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new'::text CHECK (status = ANY (ARRAY['new'::text, 'in_progress'::text, 'resolved'::text, 'archived'::text])),
  handled_by uuid,
  handled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id),
  CONSTRAINT contact_messages_handled_by_fkey FOREIGN KEY (handled_by) REFERENCES public.admin_profiles(profile_id)
);

-- ============================================================
-- 19. FEES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
  fee_type text NOT NULL CHECK (fee_type = ANY (ARRAY['tuition'::text, 'registration'::text, 'exam'::text, 'library'::text, 'other'::text])),
  amount numeric NOT NULL,
  description text,
  due_in_days integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fees_pkey PRIMARY KEY (id),
  CONSTRAINT fees_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id)
);

-- ============================================================
-- 20. INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  enrollment_id uuid,
  session_id uuid,
  invoice_number text UNIQUE,
  description text,
  amount_due numeric NOT NULL,
  amount_paid numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NGN'::text,
  due_date date,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'partially_paid'::text, 'paid'::text, 'failed'::text, 'cancelled'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  semester_id uuid,
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.academic_sessions(id),
  CONSTRAINT invoices_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT invoices_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id),
  CONSTRAINT invoices_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.academic_semesters(id)
);

-- ============================================================
-- 21. PAYMENTS (FIXED - using student_id instead of user_id)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  enrollment_id uuid,
  invoice_id uuid,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'NGN'::text,
  payment_method text CHECK (payment_method = ANY (ARRAY['paystack'::text, 'bank_transfer'::text, 'cash'::text])),
  paystack_reference text UNIQUE,
  paystack_access_code text,
  provider_transaction_id text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'success'::text, 'failed'::text, 'abandoned'::text, 'refunded'::text])),
  description text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT payments_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id),
  CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);

-- ============================================================
-- 22. PAYMENT EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_id uuid,
  invoice_id uuid,
  event_type text NOT NULL,
  provider text DEFAULT 'paystack'::text,
  provider_reference text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  signature text,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_events_pkey PRIMARY KEY (id),
  CONSTRAINT payment_events_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id),
  CONSTRAINT payment_events_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);

-- ============================================================
-- 23. STUDENT NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL DEFAULT 'general'::text,
  category text,
  deep_link text,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone,
  sent_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT student_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT student_notifications_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student_profiles(profile_id),
  CONSTRAINT student_notifications_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES public.profiles(id)
);

-- ============================================================
-- 24. ADMIN NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL DEFAULT 'general'::text,
  category text,
  deep_link text,
  priority text NOT NULL DEFAULT 'normal'::text CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'critical'::text])),
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone,
  sent_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT admin_notifications_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin_profiles(profile_id),
  CONSTRAINT admin_notifications_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES public.profiles(id)
);

-- ============================================================
-- 25. SCHOOL SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.school_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  value_json jsonb,
  is_public boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT school_settings_pkey PRIMARY KEY (id)
);

-- ============================================================
-- 26. AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_role text,
  action text NOT NULL,
  entity_name text NOT NULL,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id)
);

-- ============================================================
-- 27. ASPIRANT PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.aspirant_profiles (
  profile_id uuid NOT NULL,
  admission_number text UNIQUE,
  jamb_reg_no text UNIQUE,
  preferred_program_id uuid,
  application_type text NOT NULL DEFAULT 'Fresh admission'::text CHECK (application_type = ANY (ARRAY['Fresh admission'::text, 'Transfer candidate'::text, 'Returning applicant'::text, 'Special consideration'::text])),
  application_status text NOT NULL DEFAULT 'draft'::text CHECK (application_status = ANY (ARRAY['draft'::text, 'incomplete'::text, 'submitted'::text, 'under_review'::text, 'correction_required'::text, 'approved'::text, 'rejected'::text])),
  current_stage text NOT NULL DEFAULT 'signup'::text CHECK (current_stage = ANY (ARRAY['signup'::text, 'profile'::text, 'documents'::text, 'exam'::text, 'payment'::text, 'submitted'::text, 'admitted'::text])),
  profile_completion integer NOT NULL DEFAULT 0 CHECK (profile_completion >= 0 AND profile_completion <= 100),
  admission_session text,
  submission_notes text,
  submitted_at timestamp with time zone,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  review_feedback text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT aspirant_profiles_pkey PRIMARY KEY (profile_id),
  CONSTRAINT aspirant_profiles_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT aspirant_profiles_preferred_program_id_fkey FOREIGN KEY (preferred_program_id) REFERENCES public.programs(id),
  CONSTRAINT aspirant_profiles_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.admin_profiles(profile_id)
);

-- ============================================================
-- 28. ADMISSION DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admission_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  document_type text NOT NULL CHECK (document_type = ANY (ARRAY['passport_photo'::text, 'signature'::text, 'birth_certificate'::text, 'age_declaration'::text, 'primary_certificate'::text, 'secondary_certificate'::text, 'indigene_certificate'::text, 'nin_slip'::text, 'jamb_result'::text, 'jamb_registration_form'::text, 'other'::text])),
  storage_bucket text NOT NULL DEFAULT 'admission-documents'::text,
  storage_path text NOT NULL UNIQUE,
  file_name text NOT NULL,
  mime_type text,
  file_size bigint,
  verification_status text NOT NULL DEFAULT 'pending'::text CHECK (verification_status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text, 'needs_correction'::text])),
  verification_note text,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  verified_by uuid,
  verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  media_provider text NOT NULL DEFAULT 'cloudinary'::text,
  CONSTRAINT admission_documents_pkey PRIMARY KEY (id),
  CONSTRAINT admission_documents_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.aspirant_profiles(profile_id),
  CONSTRAINT admission_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id),
  CONSTRAINT admission_documents_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.admin_profiles(profile_id)
);

-- ============================================================
-- 29. ASPIRANT PROFILE PHOTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.aspirant_profile_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'profile-photos'::text,
  storage_path text NOT NULL UNIQUE,
  file_name text NOT NULL,
  mime_type text,
  file_size bigint,
  is_primary boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  media_provider text NOT NULL DEFAULT 'cloudinary'::text,
  CONSTRAINT aspirant_profile_photos_pkey PRIMARY KEY (id),
  CONSTRAINT aspirant_profile_photos_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.aspirant_profiles(profile_id),
  CONSTRAINT aspirant_profile_photos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id)
);

-- ============================================================
-- 30. ADMISSION STATUS HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admission_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  previous_status text,
  new_status text NOT NULL,
  note text,
  changed_by uuid,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admission_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT admission_status_history_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.aspirant_profiles(profile_id),
  CONSTRAINT admission_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id)
);

-- ============================================================
-- 31. ASPIRANT NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.aspirant_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  aspirant_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL DEFAULT 'general'::text,
  category text NOT NULL DEFAULT 'general'::text,
  deep_link text,
  is_read boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'normal'::text CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'urgent'::text])),
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT aspirant_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT aspirant_notifications_aspirant_id_fkey FOREIGN KEY (aspirant_id) REFERENCES public.profiles(id),
  CONSTRAINT aspirant_notifications_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- ============================================================
-- 32. ASPIRANT ACADEMIC RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.aspirant_academic_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  aspirant_id uuid NOT NULL,
  result_type text NOT NULL DEFAULT 'secondary'::text CHECK (result_type = ANY (ARRAY['secondary'::text, 'diploma'::text, 'nce'::text, 'hnd'::text, 'degree'::text, 'professional'::text])),
  exam_body text NOT NULL CHECK (exam_body = ANY (ARRAY['WAEC'::text, 'NECO'::text, 'NABTEB'::text, 'IJMB'::text, 'JUPEB'::text, 'Diploma'::text, 'Other'::text])),
  exam_year integer,
  sitting_number integer NOT NULL DEFAULT 1 CHECK (sitting_number = ANY (ARRAY[1, 2])),
  is_combined boolean NOT NULL DEFAULT false,
  qualification_title text,
  institution_name text,
  result_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  file_bucket text DEFAULT 'admission-documents'::text,
  file_path text,
  file_name text,
  file_mime_type text,
  verification_status text NOT NULL DEFAULT 'pending'::text CHECK (verification_status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text, 'needs_correction'::text])),
  verification_note text,
  verified_by uuid,
  verified_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT aspirant_academic_results_pkey PRIMARY KEY (id),
  CONSTRAINT aspirant_academic_results_aspirant_id_fkey FOREIGN KEY (aspirant_id) REFERENCES public.profiles(id),
  CONSTRAINT aspirant_academic_results_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.admin_profiles(profile_id),
  CONSTRAINT aspirant_academic_results_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- ============================================================
-- 33. TEACHER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  profile_id uuid NOT NULL,
  employee_number text UNIQUE,
  staff_number text UNIQUE,
  qualification text,
  specialization text,
  department text,
  employment_type text CHECK (employment_type = ANY (ARRAY['full_time'::text, 'part_time'::text, 'adjunct'::text, 'contract'::text])),
  date_joined date,
  office_location text,
  office_hours text,
  can_publish_results boolean NOT NULL DEFAULT false,
  can_enter_scores boolean NOT NULL DEFAULT true,
  employment_status text DEFAULT 'active'::text CHECK (employment_status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT teacher_profiles_pkey PRIMARY KEY (profile_id),
  CONSTRAINT teacher_profiles_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- ============================================================
-- 34. TEACHER NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL DEFAULT 'general'::text,
  category text,
  deep_link text,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone,
  sent_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT teacher_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_notifications_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teacher_profiles(profile_id),
  CONSTRAINT teacher_notifications_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES public.profiles(id)
);

-- ============================================================
-- 35. PROCTORING LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.proctoring_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  aspirant_id uuid NOT NULL,
  event_type text NOT NULL,
  violation_details text,
  screenshot_url text,
  device_fingerprint text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT proctoring_logs_pkey PRIMARY KEY (id),
  CONSTRAINT proctoring_logs_aspirant_id_fkey FOREIGN KEY (aspirant_id) REFERENCES public.profiles(id)
);

-- ============================================================
-- 36. ENTRANCE EXAM RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.entrance_exam_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  aspirant_id uuid NOT NULL,
  exam_type text NOT NULL DEFAULT 'entrance'::text,
  score numeric NOT NULL CHECK (score >= 0::numeric AND score <= 100::numeric),
  total_questions integer NOT NULL CHECK (total_questions > 0),
  percentage numeric NOT NULL CHECK (percentage >= 0::numeric AND percentage <= 100::numeric),
  grade text NOT NULL CHECK (grade = ANY (ARRAY['A'::text, 'B'::text, 'C'::text, 'D'::text, 'E'::text, 'F'::text])),
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  proctoring_snapshot jsonb,
  status text NOT NULL DEFAULT 'submitted'::text CHECK (status = ANY (ARRAY['submitted'::text, 'reviewed'::text, 'approved'::text, 'rejected'::text])),
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  review_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT entrance_exam_results_pkey PRIMARY KEY (id),
  CONSTRAINT entrance_exam_results_aspirant_id_fkey FOREIGN KEY (aspirant_id) REFERENCES public.profiles(id),
  CONSTRAINT entrance_exam_results_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.admin_profiles(profile_id)
);

-- ============================================================
-- 37. ENTRANCE EXAM CONFIGURATION (Admin-managed)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.entrance_exam_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exam_name text NOT NULL DEFAULT 'Entrance Examination',
  exam_description text,
  duration_minutes integer NOT NULL DEFAULT 10,
  total_questions integer NOT NULL DEFAULT 4,
  passing_score numeric NOT NULL DEFAULT 50,
  is_active boolean NOT NULL DEFAULT true,
  instructions text,
  created_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT entrance_exam_config_pkey PRIMARY KEY (id),
  CONSTRAINT entrance_exam_config_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- ============================================================
-- 38. EXAM QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exam_config_id uuid NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice'::text CHECK (question_type = ANY (ARRAY['multiple_choice'::text, 'true_false'::text, 'essay'::text])),
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer text NOT NULL,
  points numeric NOT NULL DEFAULT 1,
  question_order integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exam_questions_pkey PRIMARY KEY (id),
  CONSTRAINT exam_questions_exam_config_id_fkey FOREIGN KEY (exam_config_id) REFERENCES public.entrance_exam_config(id) ON DELETE CASCADE
);

-- ============================================================
-- 39. EXAM SESSIONS (Tracks when aspirants take exams)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exam_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  aspirant_id uuid NOT NULL,
  exam_config_id uuid NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  submitted_at timestamp with time zone,
  time_spent_seconds integer,
  status text NOT NULL DEFAULT 'in_progress'::text CHECK (status = ANY (ARRAY['in_progress'::text, 'submitted'::text, 'timeout'::text, 'abandoned'::text])),
  proctoring_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exam_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT exam_sessions_aspirant_id_fkey FOREIGN KEY (aspirant_id) REFERENCES public.profiles(id),
  CONSTRAINT exam_sessions_exam_config_id_fkey FOREIGN KEY (exam_config_id) REFERENCES public.entrance_exam_config(id)
);

-- ============================================================
-- 40. EXAM ANSWERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exam_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exam_session_id uuid NOT NULL,
  question_id uuid NOT NULL,
  aspirant_id uuid NOT NULL,
  selected_answer text,
  is_correct boolean,
  points_earned numeric DEFAULT 0,
  answered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exam_answers_pkey PRIMARY KEY (id),
  CONSTRAINT exam_answers_exam_session_id_fkey FOREIGN KEY (exam_session_id) REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  CONSTRAINT exam_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.exam_questions(id),
  CONSTRAINT exam_answers_aspirant_id_fkey FOREIGN KEY (aspirant_id) REFERENCES public.profiles(id)
);

-- ============================================================
-- INDEXES FOR BETTER PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_stage ON public.profiles(stage);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_admission_documents_application_id ON public.admission_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_aspirant_profiles_profile_id ON public.aspirant_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_entrance_exam_results_aspirant_id ON public.entrance_exam_results(aspirant_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_config_id ON public.exam_questions(exam_config_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_aspirant_id ON public.exam_sessions(aspirant_id);
CREATE INDEX IF NOT EXISTS idx_exam_answers_exam_session_id ON public.exam_answers(exam_session_id);

-- ============================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_profiles_updated_at ON public.student_profiles;
CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_profiles_updated_at ON public.admin_profiles;
CREATE TRIGGER update_admin_profiles_updated_at BEFORE UPDATE ON public.admin_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_aspirant_profiles_updated_at ON public.aspirant_profiles;
CREATE TRIGGER update_aspirant_profiles_updated_at BEFORE UPDATE ON public.aspirant_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admission_documents_updated_at ON public.admission_documents;
CREATE TRIGGER update_admission_documents_updated_at BEFORE UPDATE ON public.admission_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entrance_exam_config_updated_at ON public.entrance_exam_config;
CREATE TRIGGER update_entrance_exam_config_updated_at BEFORE UPDATE ON public.entrance_exam_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_questions_updated_at ON public.exam_questions;
CREATE TRIGGER update_exam_questions_updated_at BEFORE UPDATE ON public.exam_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_sessions_updated_at ON public.exam_sessions;
CREATE TRIGGER update_exam_sessions_updated_at BEFORE UPDATE ON public.exam_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aspirant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aspirant_profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrance_exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proctoring_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrance_exam_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Student profiles
CREATE POLICY "Students can view own profile" ON public.student_profiles FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Students can update own profile" ON public.student_profiles FOR UPDATE USING (auth.uid() = profile_id);

-- Admin profiles
CREATE POLICY "Admins can view own profile" ON public.admin_profiles FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Admins can update own profile" ON public.admin_profiles FOR UPDATE USING (auth.uid() = profile_id);

-- Aspirant profiles
CREATE POLICY "Aspirants can view own profile" ON public.aspirant_profiles FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Aspirants can update own profile" ON public.aspirant_profiles FOR UPDATE USING (auth.uid() = profile_id);

-- Admission documents
CREATE POLICY "Users can view own documents" ON public.admission_documents FOR SELECT USING (auth.uid() = uploaded_by);
CREATE POLICY "Users can insert own documents" ON public.admission_documents FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Aspirant profile photos
CREATE POLICY "Users can view own photos" ON public.aspirant_profile_photos FOR SELECT USING (auth.uid() = uploaded_by);
CREATE POLICY "Users can insert own photos" ON public.aspirant_profile_photos FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Payments
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Entrance exam results
CREATE POLICY "Aspirants can view own results" ON public.entrance_exam_results FOR SELECT USING (auth.uid() = aspirant_id);
CREATE POLICY "Aspirants can insert own results" ON public.entrance_exam_results FOR INSERT WITH CHECK (auth.uid() = aspirant_id);

-- Proctoring logs
CREATE POLICY "Aspirants can view own logs" ON public.proctoring_logs FOR SELECT USING (auth.uid() = aspirant_id);
CREATE POLICY "System can insert proctoring logs" ON public.proctoring_logs FOR INSERT WITH CHECK (true);

-- Exam config: Everyone can view active exam, admins can manage
CREATE POLICY "Anyone can view active exam config" ON public.entrance_exam_config FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage exam config" ON public.entrance_exam_config FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Exam questions: Everyone can view active questions, admins can manage
CREATE POLICY "Anyone can view active exam questions" ON public.exam_questions FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage exam questions" ON public.exam_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Exam sessions: Aspirants can view/create own sessions
CREATE POLICY "Aspirants can view own exam sessions" ON public.exam_sessions FOR SELECT USING (auth.uid() = aspirant_id);
CREATE POLICY "Aspirants can create exam sessions" ON public.exam_sessions FOR INSERT WITH CHECK (auth.uid() = aspirant_id);
CREATE POLICY "Admins can view all exam sessions" ON public.exam_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Exam answers: Aspirants can view/create own answers
CREATE POLICY "Aspirants can view own exam answers" ON public.exam_answers FOR SELECT USING (auth.uid() = aspirant_id);
CREATE POLICY "Aspirants can create exam answers" ON public.exam_answers FOR INSERT WITH CHECK (auth.uid() = aspirant_id);
CREATE POLICY "Admins can view all exam answers" ON public.exam_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================
-- Insert sample academic session
INSERT INTO public.academic_sessions (name, starts_on, ends_on, is_current, is_active) 
VALUES ('2024/2025', '2024-09-01', '2025-07-31', true, true)
ON CONFLICT (name) DO NOTHING;

-- Insert sample department
INSERT INTO public.departments (name, code, description, is_active) 
VALUES ('Health Technology', 'CHT', 'Department of Health Technology', true)
ON CONFLICT (name) DO NOTHING;

-- Insert sample program
INSERT INTO public.programs (title, slug, description, duration_months, duration_unit, tuition_fee, level, admission_open, is_active)
VALUES ('Diploma in Health Technology', 'diploma-health-tech', 'Comprehensive diploma program in health technology', 24, 'months', 150000, 'diploma', true, true)
ON CONFLICT (title) DO NOTHING;

-- Insert default exam configuration
INSERT INTO public.entrance_exam_config (exam_name, exam_description, duration_minutes, total_questions, passing_score, instructions, is_active)
VALUES (
  'Entrance Examination',
  'CCHT Intake Screening Examination',
  10,
  4,
  50,
  'This exam consists of multiple-choice questions. You have 10 minutes to complete the exam. Each question carries equal marks. Your score will be calculated automatically upon submission.',
  true
) ON CONFLICT DO NOTHING;

-- Insert sample exam questions
INSERT INTO public.exam_questions (exam_config_id, question_text, question_type, options, correct_answer, points, question_order, is_active)
SELECT 
  id,
  'Which of the following is the primary unit of life in human biology?',
  'multiple_choice',
  '["Tissue", "Cell", "Organ", "System"]'::jsonb,
  'Cell',
  1,
  1,
  true
FROM public.entrance_exam_config WHERE exam_name = 'Entrance Examination'
ON CONFLICT DO NOTHING;

INSERT INTO public.exam_questions (exam_config_id, question_text, question_type, options, correct_answer, points, question_order, is_active)
SELECT 
  id,
  'What is the primary function of white blood cells (leukocytes)?',
  'multiple_choice',
  '["Oxygen transport", "Immune response and defense", "Blood clotting", "Hormone regulation"]'::jsonb,
  'Immune response and defense',
  1,
  2,
  true
FROM public.entrance_exam_config WHERE exam_name = 'Entrance Examination'
ON CONFLICT DO NOTHING;

INSERT INTO public.exam_questions (exam_config_id, question_text, question_type, options, correct_answer, points, question_order, is_active)
SELECT 
  id,
  'Which organ is primarily responsible for filtering waste from the bloodstream?',
  'multiple_choice',
  '["Liver", "Heart", "Kidney", "Lungs"]'::jsonb,
  'Kidney',
  1,
  3,
  true
FROM public.entrance_exam_config WHERE exam_name = 'Entrance Examination'
ON CONFLICT DO NOTHING;

INSERT INTO public.exam_questions (exam_config_id, question_text, question_type, options, correct_answer, points, question_order, is_active)
SELECT 
  id,
  'What does CA typically stand for in tertiary academics?',
  'multiple_choice',
  '["Continuous Assessment", "College Admin", "Class Attendance", "Course Advisor"]'::jsonb,
  'Continuous Assessment',
  1,
  4,
  true
FROM public.entrance_exam_config WHERE exam_name = 'Entrance Examination'
ON CONFLICT DO NOTHING;

-- ============================================================
-- COMPLETE!
-- ============================================================
-- Database setup is complete. All tables, indexes, triggers, and RLS policies have been created.
-- You can now use the application with full database functionality.
-- ============================================================