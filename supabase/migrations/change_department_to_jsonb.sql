-- ============================================================
-- Change department column in teacher_profiles from text to jsonb
-- This allows lecturers to be assigned to multiple departments
-- ============================================================

-- Add a new jsonb column for multiple departments
ALTER TABLE public.teacher_profiles 
ADD COLUMN IF NOT EXISTS departments jsonb DEFAULT '[]'::jsonb;

-- Migrate existing data from department text column to departments jsonb array
UPDATE public.teacher_profiles 
SET departments = to_jsonb(ARRAY[department])
WHERE department IS NOT NULL AND department != '' AND (departments IS NULL OR departments = '[]'::jsonb);