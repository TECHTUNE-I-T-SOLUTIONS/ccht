-- ============================================================
-- EXAM MANAGEMENT TABLES
-- Run this file in Supabase SQL Editor to create exam tables
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. ENTRANCE EXAM CONFIGURATION (Admin-managed)
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
-- 2. EXAM QUESTIONS
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
-- 3. EXAM SESSIONS (Tracks when aspirants take exams)
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
-- 4. EXAM ANSWERS
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

DROP TRIGGER IF EXISTS update_entrance_exam_config_updated_at ON public.entrance_exam_config;
CREATE TRIGGER update_entrance_exam_config_updated_at BEFORE UPDATE ON public.entrance_exam_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_questions_updated_at ON public.exam_questions;
CREATE TRIGGER update_exam_questions_updated_at BEFORE UPDATE ON public.exam_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_sessions_updated_at ON public.exam_sessions;
CREATE TRIGGER update_exam_sessions_updated_at BEFORE UPDATE ON public.exam_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE public.entrance_exam_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;

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
-- SAMPLE DATA
-- ============================================================
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
-- Exam tables created successfully
-- ============================================================