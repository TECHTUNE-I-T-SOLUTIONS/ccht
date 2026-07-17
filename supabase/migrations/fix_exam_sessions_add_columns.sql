-- Add missing columns to exam_sessions table for entrance exam functionality
ALTER TABLE public.exam_sessions 
ADD COLUMN IF NOT EXISTS academic_year text,
ADD COLUMN IF NOT EXISTS exam_type text DEFAULT 'Entrance Examination',
ADD COLUMN IF NOT EXISTS score integer,
ADD COLUMN IF NOT EXISTS total_questions integer,
ADD COLUMN IF NOT EXISTS percentage numeric;

-- Make exam_config_id nullable for backward compatibility
ALTER TABLE public.exam_sessions ALTER COLUMN exam_config_id DROP NOT NULL;

-- Add RLS policies for exam_sessions if they don't exist
DROP POLICY IF EXISTS "Aspirants can view their own exam sessions" ON public.exam_sessions;
CREATE POLICY "Aspirants can view their own exam sessions"
ON public.exam_sessions FOR SELECT
USING (auth.uid() = aspirant_id);

DROP POLICY IF EXISTS "Aspirants can insert their own exam sessions" ON public.exam_sessions;
CREATE POLICY "Aspirants can insert their own exam sessions"
ON public.exam_sessions FOR INSERT
WITH CHECK (auth.uid() = aspirant_id);

DROP POLICY IF EXISTS "Aspirants can update their own exam sessions" ON public.exam_sessions;
CREATE POLICY "Aspirants can update their own exam sessions"
ON public.exam_sessions FOR UPDATE
USING (auth.uid() = aspirant_id)
WITH CHECK (auth.uid() = aspirant_id);

-- Fix RLS policy for aspirant_notifications to allow inserts
DROP POLICY IF EXISTS "Aspirants can insert notifications" ON public.aspirant_notifications;
CREATE POLICY "Aspirants can insert notifications"
ON public.aspirant_notifications FOR INSERT
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aspirant_notifications ENABLE ROW LEVEL SECURITY;
