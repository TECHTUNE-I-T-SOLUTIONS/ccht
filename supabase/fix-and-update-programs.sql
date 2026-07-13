-- Comprehensive fix and update for programs table
-- This script will:
-- 1. Make tuition_fee column nullable
-- 2. Add new columns for program details
-- 3. Update all existing programs with comprehensive information

-- ============================================
-- STEP 1: Make tuition_fee nullable
-- ============================================
ALTER TABLE programs 
ALTER COLUMN tuition_fee DROP NOT NULL;

-- ============================================
-- STEP 2: Add new columns for program details
-- ============================================
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS overview TEXT,
ADD COLUMN IF NOT EXISTS entry_requirements TEXT,
ADD COLUMN IF NOT EXISTS career_prospects TEXT;

-- ============================================
-- STEP 3: Set all tuition fees to NULL
-- ============================================
UPDATE programs 
SET tuition_fee = NULL 
WHERE tuition_fee IS NOT NULL;

-- ============================================
-- STEP 4: Update all programs with comprehensive details
-- ============================================

-- Update Community Health ND
UPDATE programs 
SET 
    description = 'National Diploma program in Community Health preparing students for primary healthcare services',
    overview = 'This program provides comprehensive training in community health practices, preparing students to deliver essential healthcare services at the community level. Students will learn about health promotion, disease prevention, and basic healthcare delivery in community settings.',
    entry_requirements = 'Minimum of 5 O''Level credits including English Language, Mathematics, Biology/Health Science, and any other two subjects. WAEC/NECO/NABTEB results accepted.',
    career_prospects = 'Graduates can work as Community Health Officers, Health Supervisors, or pursue further education to HND level. Employment opportunities exist in primary healthcare centers, NGOs, and government health agencies.'
WHERE slug = 'community-health-nd';

-- Update Community Health HND
UPDATE programs 
SET 
    description = 'Higher National Diploma program in Community Health for advanced healthcare practice',
    overview = 'An advanced program that builds on the ND foundation to develop expertise in community health management, leadership, and specialized healthcare services. Students gain advanced knowledge in public health policies, health education, and community development.',
    entry_requirements = 'Minimum of Lower Credit in Community Health ND or equivalent qualification. Must have completed ND program from an accredited institution.',
    career_prospects = 'Graduates can work as Senior Community Health Officers, Health Program Managers, or pursue degree programs in Public Health. Career opportunities include leadership roles in health organizations and NGOs.'
WHERE slug = 'community-health-hnd';

-- Update Health Technician ND
UPDATE programs 
SET 
    description = 'National Diploma program for Health Technicians',
    overview = 'This program trains students in technical healthcare skills including laboratory techniques, patient care, and medical equipment operation. Students gain hands-on experience in various healthcare settings to become competent health technicians.',
    entry_requirements = 'Minimum of 5 O''Level credits including English Language, Mathematics, Biology/Health Science, Chemistry, and any other subject. Not more than two sittings.',
    career_prospects = 'Graduates can work as Health Technicians, Medical Laboratory Technicians, or pursue HND programs. Employment in hospitals, diagnostic centers, and healthcare facilities.'
WHERE slug = 'health-technician-nd';

-- Update Health Assistant ND
UPDATE programs 
SET 
    description = 'National Diploma program for Health Assistants',
    overview = 'A foundational program that equips students with basic healthcare skills to assist healthcare professionals. The curriculum covers patient care, health education, and basic medical procedures.',
    entry_requirements = 'Minimum of 5 O''Level credits including English Language, Mathematics, Biology/Health Science, and any other two subjects.',
    career_prospects = 'Graduates can work as Health Assistants, Patient Care Assistants, or Community Health Workers. Opportunities in hospitals, clinics, and community health centers.'
WHERE slug = 'health-assistant-nd';

-- Update Public Health Technology HND
UPDATE programs 
SET 
    description = 'Higher National Diploma program in Public Health Technology',
    overview = 'An advanced program focusing on public health management, epidemiology, health policy, and disease prevention strategies. Students develop skills to design and implement public health programs at community and national levels.',
    entry_requirements = 'Minimum of Lower Credit in Health Technician ND, Health Assistant ND, or equivalent qualification in health-related field.',
    career_prospects = 'Graduates can work as Public Health Officers, Epidemiologists, Health Program Managers, or pursue degree programs in Public Health. Career opportunities in government health agencies, NGOs, and international health organizations.'
WHERE slug = 'public-health-technology-hnd';

-- ============================================
-- STEP 5: Verify the updates
-- ============================================
SELECT 
    id,
    title,
    slug,
    tuition_fee,
    CASE 
        WHEN overview IS NOT NULL THEN '✓ Has overview' 
        ELSE '✗ Missing overview' 
    END as overview_status,
    CASE 
        WHEN entry_requirements IS NOT NULL THEN '✓ Has entry requirements' 
        ELSE '✗ Missing entry requirements' 
    END as entry_req_status,
    CASE 
        WHEN career_prospects IS NOT NULL THEN '✓ Has career prospects' 
        ELSE '✗ Missing career prospects' 
    END as career_prospects_status
FROM programs 
ORDER BY title;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- All programs have been updated successfully!
-- Tuition fees are now nullable and set to NULL for all programs.
-- All programs now have comprehensive details including:
--   - Overview
--   - Entry requirements
--   - Career prospects
-- 
-- You can now view all program pages at:
--   - /programs/community-health-nd
--   - /programs/community-health-hnd
--   - /programs/health-technician-nd
--   - /programs/health-assistant-nd
--   - /programs/public-health-technology-hnd