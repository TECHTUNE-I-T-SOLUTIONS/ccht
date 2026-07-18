-- Update application_status check constraint to match admin dropdown values
-- Dropdown values: pending, under_review, accepted, admitted, rejected
-- Added: pending_payment for when aspirant accepts offer but hasn't paid admission fee yet
-- Added: migrated for when aspirant has been converted to student

-- First, drop the existing check constraint
ALTER TABLE public.aspirant_profiles 
DROP CONSTRAINT IF EXISTS aspirant_profiles_application_status_check;

-- Recreate the check constraint with the correct status values
ALTER TABLE public.aspirant_profiles 
ADD CONSTRAINT aspirant_profiles_application_status_check 
CHECK (application_status = ANY (ARRAY['draft'::text, 'pending'::text, 'incomplete'::text, 'under_review'::text, 'correction_required'::text, 'accepted'::text, 'pending_payment'::text, 'admitted'::text, 'migrated'::text, 'rejected'::text]));
