-- Add courses JSON column to teacher_profile table
-- This will store an array of course IDs that the teacher is assigned to

ALTER TABLE public.teacher_profiles 
ADD COLUMN IF NOT EXISTS courses JSONB DEFAULT '[]'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN public.teacher_profiles.courses IS 'Array of course IDs that the teacher is assigned to teach';
