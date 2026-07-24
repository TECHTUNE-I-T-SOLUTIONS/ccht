-- Remove signup-time profile triggers that can fire before role-specific rows exist.
-- Run this in Supabase SQL Editor.

BEGIN;

DROP TRIGGER IF EXISTS trigger_lecturer_signup ON public.profiles;
DROP TRIGGER IF EXISTS trigger_student_signup ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_lecturer_signup();
DROP FUNCTION IF EXISTS public.handle_student_signup();

COMMIT;
