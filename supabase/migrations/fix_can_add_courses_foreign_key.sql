-- Fix: Remove foreign key constraint that causes query ambiguity
-- The can_add_courses_granted_by column should not have a foreign key to profiles
-- as it creates ambiguity with the existing profile_id foreign key

-- Drop the foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'student_profiles_can_add_courses_granted_by_fkey'
    ) THEN
        ALTER TABLE public.student_profiles 
        DROP CONSTRAINT student_profiles_can_add_courses_granted_by_fkey;
    END IF;
END $$;

-- Recreate the column without foreign key constraint
-- First, drop the column if it exists
ALTER TABLE public.student_profiles 
DROP COLUMN IF EXISTS can_add_courses_granted_by;

-- Add it back without foreign key
ALTER TABLE public.student_profiles 
ADD COLUMN can_add_courses_granted_by UUID;

-- Add comment
COMMENT ON COLUMN public.student_profiles.can_add_courses_granted_by IS 'Admin ID who granted the can_add_courses permission (stored as UUID without foreign key constraint to avoid query ambiguity).';
