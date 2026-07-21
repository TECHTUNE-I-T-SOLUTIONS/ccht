-- Add 'student' status to application_status check constraint
-- Add 'admission_accepted' stage to current_stage check constraint

-- First, drop the existing check constraints
ALTER TABLE public.aspirant_profiles DROP CONSTRAINT IF EXISTS aspirant_profiles_application_status_check;
ALTER TABLE public.aspirant_profiles DROP CONSTRAINT IF EXISTS aspirant_profiles_current_stage_check;

-- Re-add the check constraints with the new values
ALTER TABLE public.aspirant_profiles 
ADD CONSTRAINT aspirant_profiles_application_status_check 
CHECK (
  application_status = ANY (
    array[
      'draft'::text,
      'pending'::text,
      'incomplete'::text,
      'under_review'::text,
      'correction_required'::text,
      'accepted'::text,
      'pending_payment'::text,
      'admitted'::text,
      'admission_accepted'::text,
      'migrated'::text,
      'student'::text,
      'rejected'::text
    ]
  )
);

ALTER TABLE public.aspirant_profiles 
ADD CONSTRAINT aspirant_profiles_current_stage_check 
CHECK (
  current_stage = ANY (
    array[
      'signup'::text,
      'payment'::text,
      'documents'::text,
      'exam'::text,
      'admission_fee'::text,
      'migration'::text,
      'admission_acceptance'::text,
      'completed'::text
    ]
  )
);
