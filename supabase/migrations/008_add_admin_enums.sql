-- ============================================================
-- Admin Enum Types Migration
-- ============================================================

-- Create enum type for admin departments
CREATE TYPE admin_department AS ENUM (
  'administration',
  'academic_affairs',
  'student_affairs',
  'finance',
  'registry',
  'library',
  'health_services',
  'security',
  'ict',
  'works_and_maintenance',
  'quality_assurance',
  'research',
  'community_services',
  'other'
);

-- Create enum type for admin designations
CREATE TYPE admin_designation AS ENUM (
  'provost',
  'deputy_provost',
  'registrar',
  'dean',
  'head_of_department',
  'director',
  'lecturer',
  'senior_lecturer',
  'principal_lecturer',
  'assistant_lecturer',
  'administrative_officer',
  'executive_officer',
  'clerk',
  'technician',
  'librarian',
  'nurse',
  'security_officer',
  'it_officer',
  'accountant',
  'bursar',
  'other'
);

-- Update admin_profiles table to use enum types
ALTER TABLE public.admin_profiles 
  ALTER COLUMN department TYPE admin_department USING department::admin_department,
  ALTER COLUMN designation TYPE admin_designation USING designation::admin_designation;

-- Add comment for documentation
COMMENT ON TYPE admin_department IS 'Enum for administrative departments in the college';
COMMENT ON TYPE admin_designation IS 'Enum for administrative designations/positions in the college';
