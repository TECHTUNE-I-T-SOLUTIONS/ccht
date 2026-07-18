-- Add missing profile details to aspirant_profiles table
-- This migration adds phone, gender, nationality, date_of_birth, and state_of_origin fields

-- Add new columns to aspirant_profiles
ALTER TABLE public.aspirant_profiles
ADD COLUMN phone text,
ADD COLUMN gender text CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text, 'prefer_not_to_say'::text])),
ADD COLUMN nationality text DEFAULT 'Nigerian'::text,
ADD COLUMN date_of_birth date,
ADD COLUMN state_of_origin text;

-- Add comment to document the changes
COMMENT ON COLUMN public.aspirant_profiles.phone IS 'Phone number of the aspirant';
COMMENT ON COLUMN public.aspirant_profiles.gender IS 'Gender of the aspirant';
COMMENT ON COLUMN public.aspirant_profiles.nationality IS 'Nationality of the aspirant';
COMMENT ON COLUMN public.aspirant_profiles.date_of_birth IS 'Date of birth of the aspirant';
COMMENT ON COLUMN public.aspirant_profiles.state_of_origin IS 'State of origin of the aspirant';
