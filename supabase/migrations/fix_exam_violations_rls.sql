-- Fix RLS policy for exam_violations table
-- Add INSERT policy to allow aspirants to log violations during their exam
-- Add missing violation types to check constraint

-- First, add missing violation types to the check constraint
ALTER TABLE public.exam_violations 
  DROP CONSTRAINT IF EXISTS exam_violations_violation_type_check;

ALTER TABLE public.exam_violations 
  ADD CONSTRAINT exam_violations_violation_type_check 
  CHECK (violation_type = ANY (ARRAY['tab_switch'::text, 'fullscreen_exit'::text, 'visibility_change'::text, 'copy_paste_attempt'::text, 'devtools_open'::text, 'devtools_detected'::text, 'devtools_already_open'::text, 'element_inspection'::text, 'window_resize'::text, 'right_click'::text, 'multiple_persons'::text, 'no_face_detected'::text, 'suspicious_activity'::text, 'other'::text]));

-- Aspirants can insert violations for their own exam sessions
CREATE POLICY "Aspirants can insert own exam violations" ON public.exam_violations
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM public.exam_sessions
      WHERE aspirant_id = auth.uid()
    )
  );

-- Admins can insert violations (for manual corrections if needed)
CREATE POLICY "Admins can insert exam violations" ON public.exam_violations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
