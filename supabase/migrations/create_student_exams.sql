-- Student Exams Tables Migration
-- This migration creates tables for managing student exams, separate from aspirant entrance exams

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Student Exam Sessions Table
-- Stores exam sessions for courses
CREATE TABLE IF NOT EXISTS public.student_exam_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  course_id uuid NOT NULL,
  session_id uuid NOT NULL,
  semester_id uuid NOT NULL,
  exam_title character varying NOT NULL,
  exam_description text,
  exam_type character varying NOT NULL DEFAULT 'regular' CHECK (exam_type IN ('regular', 'mid_semester', 'final', 'supplementary', 'resit')),
  duration_minutes integer NOT NULL DEFAULT 60,
  total_marks integer NOT NULL DEFAULT 100,
  passing_marks integer NOT NULL DEFAULT 60,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  instructions text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamp with time zone,
  published_by uuid,
  allow_review boolean NOT NULL DEFAULT true,
  review_start_date timestamp with time zone,
  review_end_date timestamp with time zone,
  proctoring_enabled boolean NOT NULL DEFAULT true,
  proctoring_config_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT student_exam_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT student_exam_sessions_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE,
  CONSTRAINT student_exam_sessions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  CONSTRAINT student_exam_sessions_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.academic_semesters(id) ON DELETE CASCADE,
  CONSTRAINT student_exam_sessions_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.admin_profiles(profile_id) ON DELETE SET NULL,
  CONSTRAINT student_exam_sessions_proctoring_config_fkey FOREIGN KEY (proctoring_config_id) REFERENCES public.exam_proctoring_config(id) ON DELETE SET NULL
);

-- Student Exam Questions Table
-- Stores questions for each exam session
CREATE TABLE IF NOT EXISTS public.student_exam_questions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  exam_session_id uuid NOT NULL,
  question_text text NOT NULL,
  question_type character varying NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank')),
  question_number integer NOT NULL,
  marks integer NOT NULL DEFAULT 1,
  options jsonb, -- For multiple choice: [{"text": "Option A", "is_correct": false}, ...]
  correct_answer text, -- For non-multiple choice types
  explanation text, -- Optional explanation for the answer
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT student_exam_questions_pkey PRIMARY KEY (id),
  CONSTRAINT student_exam_questions_exam_session_id_fkey FOREIGN KEY (exam_session_id) REFERENCES public.student_exam_sessions(id) ON DELETE CASCADE,
  CONSTRAINT student_exam_questions_unique_question UNIQUE (exam_session_id, question_number)
);

-- Student Exam Attempts Table
-- Tracks student attempts at exams
CREATE TABLE IF NOT EXISTS public.student_exam_attempts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  exam_session_id uuid NOT NULL,
  student_id uuid NOT NULL,
  enrollment_id uuid,
  attempt_number integer NOT NULL DEFAULT 1,
  status character varying NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'submitted', 'auto_submitted', 'abandoned', 'graded')),
  started_at timestamp with time zone,
  submitted_at timestamp with time zone,
  time_spent_seconds integer DEFAULT 0,
  total_score numeric,
  percentage_score numeric,
  grade character varying,
  passed boolean,
  graded_by uuid,
  graded_at timestamp with time zone,
  grading_notes text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT student_exam_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT student_exam_attempts_exam_session_id_fkey FOREIGN KEY (exam_session_id) REFERENCES public.student_exam_sessions(id) ON DELETE CASCADE,
  CONSTRAINT student_exam_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT student_exam_attempts_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON DELETE SET NULL,
  CONSTRAINT student_exam_attempts_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES public.teacher_profiles(profile_id) ON DELETE SET NULL,
  CONSTRAINT student_exam_attempts_unique_attempt UNIQUE (exam_session_id, student_id, attempt_number)
);

-- Student Exam Answers Table
-- Stores student's answers to exam questions
CREATE TABLE IF NOT EXISTS public.student_exam_answers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  exam_attempt_id uuid NOT NULL,
  question_id uuid NOT NULL,
  answer text, -- For text-based answers
  selected_option_id integer, -- For multiple choice (index in options array)
  is_correct boolean,
  marks_obtained numeric DEFAULT 0,
  time_spent_seconds integer DEFAULT 0,
  answered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT student_exam_answers_pkey PRIMARY KEY (id),
  CONSTRAINT student_exam_answers_exam_attempt_id_fkey FOREIGN KEY (exam_attempt_id) REFERENCES public.student_exam_attempts(id) ON DELETE CASCADE,
  CONSTRAINT student_exam_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.student_exam_questions(id) ON DELETE CASCADE,
  CONSTRAINT student_exam_answers_unique_answer UNIQUE (exam_attempt_id, question_id)
);

-- Student Exam Violations Table
-- Stores proctoring violations during exams
CREATE TABLE IF NOT EXISTS public.student_exam_violations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  exam_attempt_id uuid NOT NULL,
  violation_type character varying NOT NULL CHECK (violation_type IN ('tab_switch', 'visibility_change', 'copy_paste', 'right_click', 'devtools_open', 'multiple_faces', 'no_face', 'suspicious_movement', 'audio_detected', 'unauthorized_device', 'time_limit_exceeded', 'other')),
  severity character varying NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'severe', 'critical')),
  description text,
  screenshot_url text,
  metadata jsonb, -- Additional context about the violation
  detected_at timestamp with time zone NOT NULL DEFAULT now(),
  acknowledged_at timestamp with time zone,
  acknowledged_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT student_exam_violations_pkey PRIMARY KEY (id),
  CONSTRAINT student_exam_violations_exam_attempt_id_fkey FOREIGN KEY (exam_attempt_id) REFERENCES public.student_exam_attempts(id) ON DELETE CASCADE,
  CONSTRAINT student_exam_violations_acknowledged_by_fkey FOREIGN KEY (acknowledged_by) REFERENCES public.admin_profiles(profile_id) ON DELETE SET NULL
);

-- Student Exam Recordings Table
-- Stores information about proctoring recordings
CREATE TABLE IF NOT EXISTS public.student_exam_recordings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  exam_attempt_id uuid NOT NULL,
  recording_type character varying NOT NULL CHECK (recording_type IN ('video', 'audio', 'screen', 'webcam')),
  storage_url text NOT NULL,
  duration_seconds integer,
  file_size_bytes bigint,
  mime_type character varying,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  status character varying NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'deleted')),
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT student_exam_recordings_pkey PRIMARY KEY (id),
  CONSTRAINT student_exam_recordings_exam_attempt_id_fkey FOREIGN KEY (exam_attempt_id) REFERENCES public.student_exam_attempts(id) ON DELETE CASCADE
);

-- Student Exam Feedback Table
-- Stores student feedback on exams
CREATE TABLE IF NOT EXISTS public.student_exam_feedback (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  exam_attempt_id uuid NOT NULL,
  student_id uuid NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comments text,
  is_anonymous boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT student_exam_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT student_exam_feedback_exam_attempt_id_fkey FOREIGN KEY (exam_attempt_id) REFERENCES public.student_exam_attempts(id) ON DELETE CASCADE,
  CONSTRAINT student_exam_feedback_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT student_exam_feedback_unique_feedback UNIQUE (exam_attempt_id, student_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_student_exam_sessions_course ON public.student_exam_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_student_exam_sessions_session_semester ON public.student_exam_sessions(session_id, semester_id);
CREATE INDEX IF NOT EXISTS idx_student_exam_sessions_published ON public.student_exam_sessions(is_published, start_date);
CREATE INDEX IF NOT EXISTS idx_student_exam_questions_exam_session ON public.student_exam_questions(exam_session_id);
CREATE INDEX IF NOT EXISTS idx_student_exam_attempts_exam_session ON public.student_exam_attempts(exam_session_id);
CREATE INDEX IF NOT EXISTS idx_student_exam_attempts_student ON public.student_exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_exam_attempts_status ON public.student_exam_attempts(status);
CREATE INDEX IF NOT EXISTS idx_student_exam_answers_exam_attempt ON public.student_exam_answers(exam_attempt_id);
CREATE INDEX IF NOT EXISTS idx_student_exam_violations_exam_attempt ON public.student_exam_violations(exam_attempt_id);
CREATE INDEX IF NOT EXISTS idx_student_exam_violations_detected_at ON public.student_exam_violations(detected_at);
CREATE INDEX IF NOT EXISTS idx_student_exam_recordings_exam_attempt ON public.student_exam_recordings(exam_attempt_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.student_exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_exam_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_exam_sessions

-- Admins can view all exam sessions
CREATE POLICY "Admins can view all exam sessions"
  ON public.student_exam_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE profile_id = auth.uid()
    )
  );

-- Teachers can view exam sessions for their courses
CREATE POLICY "Teachers can view exam sessions for their courses"
  ON public.student_exam_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      JOIN public.departments d ON d.name = tp.department
      JOIN public.programs p ON p.department_id = d.id
      JOIN public.courses c ON c.program_id = p.id
      WHERE tp.profile_id = auth.uid() AND c.id = student_exam_sessions.course_id
    )
  );

-- Students can view published exam sessions for their enrolled courses
CREATE POLICY "Students can view published exam sessions for their courses"
  ON public.student_exam_sessions FOR SELECT
  USING (
    is_published = true AND
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.courses c ON c.program_id = e.program_id
      WHERE e.student_id = auth.uid() AND e.status = 'active' AND c.id = student_exam_sessions.course_id
    )
  );

-- Admins can insert exam sessions
CREATE POLICY "Admins can insert exam sessions"
  ON public.student_exam_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE profile_id = auth.uid()
    )
  );

-- Admins can update exam sessions
CREATE POLICY "Admins can update exam sessions"
  ON public.student_exam_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE profile_id = auth.uid()
    )
  );

-- Teachers can update exam sessions for their courses
CREATE POLICY "Teachers can update exam sessions for their courses"
  ON public.student_exam_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      JOIN public.departments d ON d.name = tp.department
      JOIN public.programs p ON p.department_id = d.id
      JOIN public.courses c ON c.program_id = p.id
      WHERE tp.profile_id = auth.uid() AND c.id = student_exam_sessions.course_id
    )
  );

-- Admins can delete exam sessions
CREATE POLICY "Admins can delete exam sessions"
  ON public.student_exam_sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for student_exam_questions

-- Admins can view all exam questions
CREATE POLICY "Admins can view all exam questions"
  ON public.student_exam_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE profile_id = auth.uid()
    )
  );

-- Teachers can view questions for their course exam sessions
CREATE POLICY "Teachers can view questions for their exam sessions"
  ON public.student_exam_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      JOIN public.departments d ON d.name = tp.department
      JOIN public.programs p ON p.department_id = d.id
      JOIN public.courses c ON c.program_id = p.id
      JOIN public.student_exam_sessions ses ON ses.course_id = c.id
      WHERE tp.profile_id = auth.uid() AND ses.id = student_exam_questions.exam_session_id
    )
  );

-- Students can view questions only during their active exam attempt (without correct answers)
CREATE POLICY "Students can view questions during active exam"
  ON public.student_exam_questions FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.student_exam_attempts sea
      JOIN public.student_exam_sessions ses ON ses.id = sea.exam_session_id
      WHERE sea.student_id = auth.uid() 
        AND sea.status = 'in_progress'
        AND ses.id = student_exam_questions.exam_session_id
        AND NOW() BETWEEN ses.start_date AND ses.end_date
    )
  );

-- Admins can insert exam questions
CREATE POLICY "Admins can insert exam questions"
  ON public.student_exam_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE profile_id = auth.uid()
    )
  );

-- Teachers can insert questions for their exam sessions
CREATE POLICY "Teachers can insert questions for their exam sessions"
  ON public.student_exam_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      JOIN public.departments d ON d.name = tp.department
      JOIN public.programs p ON p.department_id = d.id
      JOIN public.courses c ON c.program_id = p.id
      JOIN public.student_exam_sessions ses ON ses.course_id = c.id
      WHERE tp.profile_id = auth.uid() AND ses.id = student_exam_questions.exam_session_id
    )
  );

-- Admins can update exam questions
CREATE POLICY "Admins can update exam questions"
  ON public.student_exam_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE profile_id = auth.uid()
    )
  );

-- Teachers can update questions for their exam sessions
CREATE POLICY "Teachers can update questions for their exam sessions"
  ON public.student_exam_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      JOIN public.departments d ON d.name = tp.department
      JOIN public.programs p ON p.department_id = d.id
      JOIN public.courses c ON c.program_id = p.id
      JOIN public.student_exam_sessions ses ON ses.course_id = c.id
      WHERE tp.profile_id = auth.uid() AND ses.id = student_exam_questions.exam_session_id
    )
  );

-- Admins can delete exam questions
CREATE POLICY "Admins can delete exam questions"
  ON public.student_exam_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE profile_id = auth.uid()
    )
  );

-- RLS Policies for student_exam_attempts

-- Students can view their own exam attempts
CREATE POLICY "Students can view their own exam attempts"
  ON public.student_exam_attempts FOR SELECT
  USING (student_id = auth.uid());

-- Admins can view all exam attempts
CREATE POLICY "Admins can view all exam attempts"
  ON public.student_exam_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE profile_id = auth.uid()
    )
  );

-- Teachers can view attempts for their courses
CREATE POLICY "Teachers can view attempts for their courses"
  ON public.student_exam_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      JOIN public.departments d ON d.name = tp.department
      JOIN public.programs p ON p.department_id = d.id
      JOIN public.courses c ON c.program_id = p.id
      JOIN public.student_exam_sessions ses ON ses.course_id = c.id
      WHERE tp.profile_id = auth.uid() AND ses.id = student_exam_attempts.exam_session_id
    )
  );

-- Students can insert their own exam attempts
CREATE POLICY "Students can insert their own exam attempts"
  ON public.student_exam_attempts FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Students can update their own exam attempts (for in-progress status)
CREATE POLICY "Students can update their own in-progress attempts"
  ON public.student_exam_attempts FOR UPDATE
  USING (
    student_id = auth.uid() AND status = 'in_progress'
  );

-- Teachers can update attempts for grading
CREATE POLICY "Teachers can update attempts for grading"
  ON public.student_exam_attempts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      JOIN public.departments d ON d.name = tp.department
      JOIN public.programs p ON p.department_id = d.id
      JOIN public.courses c ON c.program_id = p.id
      JOIN public.student_exam_sessions ses ON ses.course_id = c.id
      WHERE tp.profile_id = auth.uid() AND ses.id = student_exam_attempts.exam_session_id
    )
  );

-- RLS Policies for student_exam_answers

-- Students can view their own answers
CREATE POLICY "Students can view their own answers"
  ON public.student_exam_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.student_exam_attempts
      WHERE id = student_exam_answers.exam_attempt_id AND student_id = auth.uid()
    )
  );

-- Admins can view all answers
CREATE POLICY "Admins can view all answers"
  ON public.student_exam_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE profile_id = auth.uid()
    )
  );

-- Teachers can view answers for their courses
CREATE POLICY "Teachers can view answers for their courses"
  ON public.student_exam_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      JOIN public.departments d ON d.name = tp.department
      JOIN public.programs p ON p.department_id = d.id
      JOIN public.courses c ON c.program_id = p.id
      JOIN public.student_exam_sessions ses ON ses.course_id = c.id
      JOIN public.student_exam_attempts sea ON sea.exam_session_id = ses.id
      WHERE tp.profile_id = auth.uid() AND sea.id = student_exam_answers.exam_attempt_id
    )
  );

-- Students can insert their own answers
CREATE POLICY "Students can insert their own answers"
  ON public.student_exam_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.student_exam_attempts
      WHERE id = student_exam_answers.exam_attempt_id AND student_id = auth.uid() AND status = 'in_progress'
    )
  );

-- Students can update their own answers during active exam
CREATE POLICY "Students can update their own answers during exam"
  ON public.student_exam_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.student_exam_attempts
      WHERE id = student_exam_answers.exam_attempt_id AND student_id = auth.uid() AND status = 'in_progress'
    )
  );

-- RLS Policies for student_exam_violations

-- Students can view their own violations
CREATE POLICY "Students can view their own violations"
  ON public.student_exam_violations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.student_exam_attempts
      WHERE id = student_exam_violations.exam_attempt_id AND student_id = auth.uid()
    )
  );

-- Admins can view all violations
CREATE POLICY "Admins can view all violations"
  ON public.student_exam_violations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE profile_id = auth.uid()
    )
  );

-- Teachers can view violations for their courses
CREATE POLICY "Teachers can view violations for their courses"
  ON public.student_exam_violations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      JOIN public.departments d ON d.name = tp.department
      JOIN public.programs p ON p.department_id = d.id
      JOIN public.courses c ON c.program_id = p.id
      JOIN public.student_exam_sessions ses ON ses.course_id = c.id
      JOIN public.student_exam_attempts sea ON sea.exam_session_id = ses.id
      WHERE tp.profile_id = auth.uid() AND sea.id = student_exam_violations.exam_attempt_id
    )
  );

-- System can insert violations (via triggers)
CREATE POLICY "System can insert violations"
  ON public.student_exam_violations FOR INSERT
  WITH CHECK (true);

-- RLS Policies for student_exam_recordings

-- Students can view their own recordings
CREATE POLICY "Students can view their own recordings"
  ON public.student_exam_recordings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.student_exam_attempts
      WHERE id = student_exam_recordings.exam_attempt_id AND student_id = auth.uid()
    )
  );

-- Admins can view all recordings
CREATE POLICY "Admins can view all recordings"
  ON public.student_exam_recordings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE profile_id = auth.uid()
    )
  );

-- Teachers can view recordings for their courses
CREATE POLICY "Teachers can view recordings for their courses"
  ON public.student_exam_recordings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      JOIN public.departments d ON d.name = tp.department
      JOIN public.programs p ON p.department_id = d.id
      JOIN public.courses c ON c.program_id = p.id
      JOIN public.student_exam_sessions ses ON ses.course_id = c.id
      JOIN public.student_exam_attempts sea ON sea.exam_session_id = ses.id
      WHERE tp.profile_id = auth.uid() AND sea.id = student_exam_recordings.exam_attempt_id
    )
  );

-- System can insert recordings
CREATE POLICY "System can insert recordings"
  ON public.student_exam_recordings FOR INSERT
  WITH CHECK (true);

-- RLS Policies for student_exam_feedback

-- Students can view their own feedback
CREATE POLICY "Students can view their own feedback"
  ON public.student_exam_feedback FOR SELECT
  USING (student_id = auth.uid());

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON public.student_exam_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE profile_id = auth.uid()
    )
  );

-- Students can insert their own feedback
CREATE POLICY "Students can insert their own feedback"
  ON public.student_exam_feedback FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_student_exams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER student_exam_sessions_updated_at
  BEFORE UPDATE ON public.student_exam_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_student_exams_updated_at();

CREATE TRIGGER student_exam_questions_updated_at
  BEFORE UPDATE ON public.student_exam_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_student_exams_updated_at();

CREATE TRIGGER student_exam_attempts_updated_at
  BEFORE UPDATE ON public.student_exam_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_student_exams_updated_at();

CREATE TRIGGER student_exam_answers_updated_at
  BEFORE UPDATE ON public.student_exam_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_student_exams_updated_at();

CREATE TRIGGER student_exam_recordings_updated_at
  BEFORE UPDATE ON public.student_exam_recordings
  FOR EACH ROW
  EXECUTE FUNCTION update_student_exams_updated_at();

CREATE TRIGGER student_exam_feedback_updated_at
  BEFORE UPDATE ON public.student_exam_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_student_exams_updated_at();

-- Notification Functions and Triggers

-- Function to notify students when exam is published
CREATE OR REPLACE FUNCTION notify_exam_published()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
    -- Notify all enrolled students for the course
    INSERT INTO public.student_notifications (
      student_id,
      title,
      message,
      notification_type,
      category,
      deep_link,
      is_read,
      created_at,
      updated_at
    )
    SELECT 
      e.student_id,
      'New Exam Published',
      'A new exam "' || NEW.exam_title || '" has been published for ' || 
      (SELECT title FROM public.courses WHERE id = NEW.course_id) || 
      '. Exam starts on ' || TO_CHAR(NEW.start_date, 'YYYY-MM-DD HH24:MI') || '.',
      'exam',
      'academics',
      '/student/exams/' || NEW.id,
      false,
      NOW(),
      NOW()
    FROM public.enrollments e
    JOIN public.courses c ON c.program_id = e.program_id
    WHERE c.id = NEW.course_id AND e.status = 'active';
    
    -- Notify teachers for the course
    INSERT INTO public.teacher_notifications (
      teacher_id,
      title,
      message,
      notification_type,
      category,
      deep_link,
      is_read,
      sent_by,
      created_at,
      updated_at
    )
    SELECT 
      tp.profile_id,
      'Exam Published',
      'A new exam "' || NEW.exam_title || '" has been published for ' || 
      (SELECT title FROM public.courses WHERE id = NEW.course_id) || '.',
      'exam',
      'academics',
      '/teacher/exams/' || NEW.id,
      false,
      NEW.published_by,
      NOW(),
      NOW()
    FROM public.teacher_profiles tp
    JOIN public.departments d ON d.name = tp.department
    JOIN public.programs p ON p.department_id = d.id
    JOIN public.courses c ON c.program_id = p.id
    WHERE c.id = NEW.course_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exam_published_notification
  AFTER UPDATE ON public.student_exam_sessions
  FOR EACH ROW
  EXECUTE FUNCTION notify_exam_published();

-- Function to notify when student starts exam
CREATE OR REPLACE FUNCTION notify_exam_started()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'in_progress' AND (OLD.status = 'not_started' OR OLD.status IS NULL) THEN
    -- Notify teachers that a student has started the exam
    INSERT INTO public.teacher_notifications (
      teacher_id,
      title,
      message,
      notification_type,
      category,
      deep_link,
      is_read,
      sent_by,
      created_at,
      updated_at
    )
    SELECT 
      tp.profile_id,
      'Student Started Exam',
      (SELECT first_name || ' ' || last_name FROM public.profiles WHERE id = NEW.student_id) || 
      ' has started the exam "' || (SELECT exam_title FROM public.student_exam_sessions WHERE id = NEW.exam_session_id) || '".',
      'exam',
      'academics',
      '/teacher/exams/' || NEW.exam_session_id,
      false,
      NEW.student_id,
      NOW(),
      NOW()
    FROM public.teacher_profiles tp
    JOIN public.departments d ON d.name = tp.department
    JOIN public.programs p ON p.department_id = d.id
    JOIN public.courses c ON c.program_id = p.id
    JOIN public.student_exam_sessions ses ON ses.course_id = c.id
    WHERE ses.id = NEW.exam_session_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exam_started_notification
  AFTER UPDATE ON public.student_exam_attempts
  FOR EACH ROW
  EXECUTE FUNCTION notify_exam_started();

-- Function to notify when student submits exam
CREATE OR REPLACE FUNCTION notify_exam_submitted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('submitted', 'auto_submitted') AND OLD.status = 'in_progress' THEN
    -- Notify teachers that a student has submitted the exam
    INSERT INTO public.teacher_notifications (
      teacher_id,
      title,
      message,
      notification_type,
      category,
      deep_link,
      is_read,
      sent_by,
      created_at,
      updated_at
    )
    SELECT 
      tp.profile_id,
      'Student Submitted Exam',
      (SELECT first_name || ' ' || last_name FROM public.profiles WHERE id = NEW.student_id) || 
      ' has submitted the exam "' || (SELECT exam_title FROM public.student_exam_sessions WHERE id = NEW.exam_session_id) || '".',
      'exam',
      'academics',
      '/teacher/exams/' || NEW.exam_session_id,
      false,
      NEW.student_id,
      NOW(),
      NOW()
    FROM public.teacher_profiles tp
    JOIN public.departments d ON d.name = tp.department
    JOIN public.programs p ON p.department_id = d.id
    JOIN public.courses c ON c.program_id = p.id
    JOIN public.student_exam_sessions ses ON ses.course_id = c.id
    WHERE ses.id = NEW.exam_session_id;
    
    -- Notify student that exam has been received
    INSERT INTO public.student_notifications (
      student_id,
      title,
      message,
      notification_type,
      category,
      deep_link,
      is_read,
      created_at,
      updated_at
    )
    VALUES (
      NEW.student_id,
      'Exam Submitted Successfully',
      'Your exam "' || (SELECT exam_title FROM public.student_exam_sessions WHERE id = NEW.exam_session_id) || 
      '" has been submitted successfully. You will be notified when results are available.',
      'exam',
      'academics',
      '/student/exams/' || NEW.exam_session_id,
      false,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exam_submitted_notification
  AFTER UPDATE ON public.student_exam_attempts
  FOR EACH ROW
  EXECUTE FUNCTION notify_exam_submitted();

-- Function to notify when exam is graded
CREATE OR REPLACE FUNCTION notify_exam_graded()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'graded' AND OLD.status != 'graded' THEN
    -- Notify student that exam has been graded
    INSERT INTO public.student_notifications (
      student_id,
      title,
      message,
      notification_type,
      category,
      deep_link,
      is_read,
      created_at,
      updated_at
    )
    VALUES (
      NEW.student_id,
      'Exam Results Available',
      'Your exam "' || (SELECT exam_title FROM public.student_exam_sessions WHERE id = NEW.exam_session_id) || 
      '" has been graded. Score: ' || NEW.percentage_score || '%',
      'exam',
      'academics',
      '/student/exams/' || NEW.exam_session_id,
      false,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exam_graded_notification
  AFTER UPDATE ON public.student_exam_attempts
  FOR EACH ROW
  EXECUTE FUNCTION notify_exam_graded();

-- Function to notify on severe violations
CREATE OR REPLACE FUNCTION notify_exam_violation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.severity IN ('severe', 'critical') THEN
    -- Notify teachers about severe violations
    INSERT INTO public.teacher_notifications (
      teacher_id,
      title,
      message,
      notification_type,
      category,
      deep_link,
      is_read,
      sent_by,
      created_at,
      updated_at
    )
    SELECT 
      tp.profile_id,
      'Severe Exam Violation Detected',
      'A ' || NEW.severity || ' violation (' || NEW.violation_type || ') has been detected for student ' || 
      (SELECT first_name || ' ' || last_name FROM public.profiles WHERE id = 
        (SELECT student_id FROM public.student_exam_attempts WHERE id = NEW.exam_attempt_id)) || 
      ' during exam.',
      'exam',
      'security',
      '/teacher/exams/' || (SELECT exam_session_id FROM public.student_exam_attempts WHERE id = NEW.exam_attempt_id),
      false,
      (SELECT student_id FROM public.student_exam_attempts WHERE id = NEW.exam_attempt_id),
      NOW(),
      NOW()
    FROM public.teacher_profiles tp
    JOIN public.departments d ON d.name = tp.department
    JOIN public.programs p ON p.department_id = d.id
    JOIN public.courses c ON c.program_id = p.id
    JOIN public.student_exam_sessions ses ON ses.course_id = c.id
    JOIN public.student_exam_attempts sea ON sea.exam_session_id = ses.id
    WHERE sea.id = NEW.exam_attempt_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exam_violation_notification
  AFTER INSERT ON public.student_exam_violations
  FOR EACH ROW
  EXECUTE FUNCTION notify_exam_violation();
