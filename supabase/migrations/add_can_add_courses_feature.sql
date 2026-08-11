-- Migration: Add can_add_courses feature to student_profiles
-- This allows admins to grant special permission for students to add more courses
-- after their initial registration has been approved

-- Add the can_add_courses column to student_profiles table
ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS can_add_courses BOOLEAN NOT NULL DEFAULT FALSE;

-- Add a column to track when this permission was granted
ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS can_add_courses_granted_at TIMESTAMPTZ;

-- Add a column to track who granted this permission (without foreign key to avoid query ambiguity)
ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS can_add_courses_granted_by UUID;

-- Add comment to document the feature
COMMENT ON COLUMN public.student_profiles.can_add_courses IS 'Special permission allowing students to add more courses after initial registration approval. Default is FALSE.';

COMMENT ON COLUMN public.student_profiles.can_add_courses_granted_at IS 'Timestamp when the can_add_courses permission was granted.';

COMMENT ON COLUMN public.student_profiles.can_add_courses_granted_by IS 'Admin ID who granted the can_add_courses permission.';

-- Create a function to automatically turn off can_add_courses after approval
CREATE OR REPLACE FUNCTION public.turn_off_can_add_courses_after_approval()
RETURNS TRIGGER AS $$
DECLARE
  student_has_permission BOOLEAN;
BEGIN
  -- When a course is approved, check if the student has can_add_courses enabled
  -- Only turn it off if the student was granted special permission
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    SELECT can_add_courses INTO student_has_permission
    FROM public.student_profiles
    WHERE profile_id = NEW.student_id;
    
    -- If student had special permission, turn it off after approval
    IF student_has_permission = TRUE THEN
      UPDATE public.student_profiles 
      SET can_add_courses = FALSE,
          can_add_courses_granted_at = NULL,
          can_add_courses_granted_by = NULL
      WHERE profile_id = NEW.student_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically turn off can_add_courses after approval
DROP TRIGGER IF EXISTS trigger_turn_off_can_add_courses ON public.selected_courses;
CREATE TRIGGER trigger_turn_off_can_add_courses
AFTER UPDATE ON public.selected_courses
FOR EACH ROW
WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
EXECUTE FUNCTION public.turn_off_can_add_courses_after_approval();

-- Add RLS policy to allow admins to update can_add_courses
-- (Assuming admin policies exist, this adds specific permission for this column)

-- Create a helper function to check if a student can add courses
CREATE OR REPLACE FUNCTION public.student_can_add_courses(student_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_approved_courses INTEGER;
  has_permission BOOLEAN;
BEGIN
  -- Check if student has any approved courses
  SELECT COUNT(*) INTO has_approved_courses
  FROM public.selected_courses
  WHERE student_id = student_uuid AND status = 'approved';
  
  -- Get the can_add_courses permission
  SELECT can_add_courses INTO has_permission
  FROM public.student_profiles
  WHERE profile_id = student_uuid;
  
  -- Students can add courses if:
  -- 1. They have no approved courses (initial registration), OR
  -- 2. They have the special can_add_courses permission
  RETURN (has_approved_courses = 0) OR has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.student_can_add_courses(UUID) TO authenticated;

-- Add RLS policies to allow students to read their own can_add_courses status
-- (Assuming RLS is enabled on student_profiles, we need to add policies)

-- Allow students to read their own can_add_courses status
CREATE POLICY IF NOT EXISTS "Students can view own can_add_courses"
ON public.student_profiles FOR SELECT
USING (auth.uid() = profile_id);

-- Allow admins to update can_add_courses for any student
CREATE POLICY IF NOT EXISTS "Admins can update can_add_courses"
ON public.student_profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);
