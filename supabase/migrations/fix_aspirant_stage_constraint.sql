-- Fix aspirant_profiles current_stage check constraint
-- This updates the check constraint to include all valid stage values

-- Drop existing check constraint if it exists
ALTER TABLE public.aspirant_profiles DROP CONSTRAINT IF EXISTS aspirant_profiles_current_stage_check;

-- Add updated check constraint with all valid stage values
ALTER TABLE public.aspirant_profiles 
ADD CONSTRAINT aspirant_profiles_current_stage_check 
CHECK (current_stage IN ('signup', 'payment', 'documents', 'exam', 'admission_fee', 'migration', 'completed'));
