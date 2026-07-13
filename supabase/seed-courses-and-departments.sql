-- Seed data for Covenant College of Health Technology
-- This file contains departments, programs, and courses

-- ============================================
-- DEPARTMENTS
-- ============================================
INSERT INTO public.departments (name, code, description, is_active) VALUES
('Community Health Department', 'CHD', 'Department offering Community Health programs at ND and HND levels', true),
('Public Health Department', 'PHD', 'Department offering various Public Health Technology programs', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- PROGRAMS
-- ============================================
-- Get department IDs
DO $$
DECLARE
    chd_id uuid;
    phd_id uuid;
BEGIN
    SELECT id INTO chd_id FROM public.departments WHERE code = 'CHD';
    SELECT id INTO phd_id FROM public.departments WHERE code = 'PHD';

    -- Community Health Programs
    INSERT INTO public.programs (title, slug, description, overview, entry_requirements, career_prospects, level, duration_months, duration_unit, department_id, is_active) VALUES
    ('Community Health - National Diploma', 'community-health-nd', 
     'National Diploma program in Community Health preparing students for primary healthcare services',
     'This program provides comprehensive training in community health practices, preparing students to deliver essential healthcare services at the community level. Students will learn about health promotion, disease prevention, and basic healthcare delivery in community settings.',
     'Minimum of 5 O''Level credits including English Language, Mathematics, Biology/Health Science, and any other two subjects. WAEC/NECO/NABTEB results accepted.',
     'Graduates can work as Community Health Officers, Health Supervisors, or pursue further education to HND level. Employment opportunities exist in primary healthcare centers, NGOs, and government health agencies.',
     'diploma', 24, 'months', chd_id, true),
    
    ('Community Health - Higher National Diploma', 'community-health-hnd', 
     'Higher National Diploma program in Community Health for advanced healthcare practice',
     'An advanced program that builds on the ND foundation to develop expertise in community health management, leadership, and specialized healthcare services. Students gain advanced knowledge in public health policies, health education, and community development.',
     'Minimum of Lower Credit in Community Health ND or equivalent qualification. Must have completed ND program from an accredited institution.',
     'Graduates can work as Senior Community Health Officers, Health Program Managers, or pursue degree programs in Public Health. Career opportunities include leadership roles in health organizations and NGOs.',
     'diploma', 24, 'months', chd_id, true)
    ON CONFLICT (slug) DO NOTHING;

    -- Public Health Programs
    INSERT INTO public.programs (title, slug, description, overview, entry_requirements, career_prospects, level, duration_months, duration_unit, department_id, is_active) VALUES
    ('Health Technician - National Diploma', 'health-technician-nd', 
     'National Diploma program for Health Technicians',
     'This program trains students in technical healthcare skills including laboratory techniques, patient care, and medical equipment operation. Students gain hands-on experience in various healthcare settings to become competent health technicians.',
     'Minimum of 5 O''Level credits including English Language, Mathematics, Biology/Health Science, Chemistry, and any other subject. Not more than two sittings.',
     'Graduates can work as Health Technicians, Medical Laboratory Technicians, or pursue HND programs. Employment in hospitals, diagnostic centers, and healthcare facilities.',
     'diploma', 24, 'months', phd_id, true),
    
    ('Health Assistant - National Diploma', 'health-assistant-nd', 
     'National Diploma program for Health Assistants',
     'A foundational program that equips students with basic healthcare skills to assist healthcare professionals. The curriculum covers patient care, health education, and basic medical procedures.',
     'Minimum of 5 O''Level credits including English Language, Mathematics, Biology/Health Science, and any other two subjects.',
     'Graduates can work as Health Assistants, Patient Care Assistants, or Community Health Workers. Opportunities in hospitals, clinics, and community health centers.',
     'diploma', 24, 'months', phd_id, true),
    
    ('Public Health Technology - Higher National Diploma', 'public-health-technology-hnd', 
     'Higher National Diploma program in Public Health Technology',
     'An advanced program focusing on public health management, epidemiology, health policy, and disease prevention strategies. Students develop skills to design and implement public health programs at community and national levels.',
     'Minimum of Lower Credit in Health Technician ND, Health Assistant ND, or equivalent qualification in health-related field.',
     'Graduates can work as Public Health Officers, Epidemiologists, Health Program Managers, or pursue degree programs in Public Health. Career opportunities in government health agencies, NGOs, and international health organizations.',
     'diploma', 24, 'months', phd_id, true)
    ON CONFLICT (slug) DO NOTHING;
END $$;

-- ============================================
-- COURSES FOR COMMUNITY HEALTH ND
-- ============================================

-- Semester I Courses
DO $$
DECLARE
    chd_nd_id uuid;
BEGIN
    SELECT id INTO chd_nd_id FROM public.programs WHERE slug = 'community-health-nd';

    INSERT INTO public.courses (program_id, code, title, credit_units, level, semester, is_active) VALUES
    (chd_nd_id, 'CMS 111', 'ANATOMY AND PHYSIOLOGY I', 4, 'ND', 1, true),
    (chd_nd_id, 'GNS 101', 'USE OF ENGLISH I', 2, 'ND', 1, true),
    (chd_nd_id, 'GNS 111', 'CITIZENSHIP EDUCATION', 2, 'ND', 1, true),
    (chd_nd_id, 'CMH 128', 'MICROBIOLOGY AND LABORATORY PRACTICES', 2, 'ND', 1, true),
    (chd_nd_id, 'CMH 113', 'ORAL HEALTHCARE', 2, 'ND', 1, true),
    (chd_nd_id, 'CMS 112', 'INTRODUCTION TO EPIDEMIOLOGY', 2, 'ND', 1, true),
    (chd_nd_id, 'BCH 111', 'GENERAL AND PHYSICAL CHEMISTRY', 1, 'ND', 1, true),
    (chd_nd_id, 'CHE 114', 'HUMAN NUTRITION', 3, 'ND', 1, true),
    (chd_nd_id, 'EHT 111', 'INTRODUCTION TO ENVIRONMENTAL HEALTH', 2, 'ND', 1, true),
    (chd_nd_id, 'CHE 118', 'INTRODUCTION TO PRIMARY HEALTHCARE', 2, 'ND', 1, true),
    (chd_nd_id, 'CHE 123', 'SYMPTOMATOLOGY', 2, 'ND', 1, true),
    (chd_nd_id, 'COM 111', 'INTRODUCTION TO COMPUTER', 2, 'ND', 1, true)
    ON CONFLICT (code) DO NOTHING;
END $$;

-- Semester II Courses
DO $$
DECLARE
    chd_nd_id uuid;
BEGIN
    SELECT id INTO chd_nd_id FROM public.programs WHERE slug = 'community-health-nd';

    INSERT INTO public.courses (program_id, code, title, credit_units, level, semester, is_active) VALUES
    (chd_nd_id, 'CMS 121', 'ANATOMY AND PHYSIOLOGY II', 2, 'ND', 2, true),
    (chd_nd_id, 'CMH 126', 'COMMUNITY MENTAL HEALTH', 2, 'ND', 2, true),
    (chd_nd_id, 'GNS 201', 'COMMUNICATION IN ENGLISH I', 2, 'ND', 2, true),
    (chd_nd_id, 'CMH 128', 'OCCUPATIONAL HEALTH AND SAFETY', 2, 'ND', 2, true),
    (chd_nd_id, 'CMH 122', 'CLINICAL SKILLS I', 4, 'ND', 2, true),
    (chd_nd_id, 'STA 224', 'BIOSTATISTICS', 2, 'ND', 2, true),
    (chd_nd_id, 'CMH 116', 'PHARMACOLOGY AND ESSENTIAL MEDICINE', 3, 'ND', 2, true),
    (chd_nd_id, 'CMH 121', 'ACCIDENT AND EMERGENCY', 2, 'ND', 2, true),
    (chd_nd_id, 'CMH 112', 'COMMUNITY HEALTH PROFESSIONAL ETHICS', 1, 'ND', 2, true),
    (chd_nd_id, 'CMH 124', 'REPRODUCTIVE HEALTH', 2, 'ND', 2, true),
    (chd_nd_id, 'CMH 125', 'IMMUNITY AND IMMUNIZATION', 4, 'ND', 2, true),
    (chd_nd_id, 'CMH 108', 'PRIMARY HEALTHCARE MANAGEMENT I', 2, 'ND', 2, true),
    (chd_nd_id, 'CMH 120', 'CLINICAL POSTING [SIWES]', 0, 'ND', 2, true)
    ON CONFLICT (code) DO NOTHING;
END $$;

-- ============================================
-- COURSES FOR COMMUNITY HEALTH HND
-- ============================================

-- Semester I Courses
DO $$
DECLARE
    chd_hnd_id uuid;
BEGIN
    SELECT id INTO chd_hnd_id FROM public.programs WHERE slug = 'community-health-hnd';

    INSERT INTO public.courses (program_id, code, title, credit_units, level, semester, is_active) VALUES
    (chd_hnd_id, 'CMH 201', 'INTRODUCTION TO HOME AND RURAL ECONOMICS', 2, 'HND', 1, true),
    (chd_hnd_id, 'HED 101', 'INTRODUCTION TO HEALTH EDUCATION', 2, 'HND', 1, true),
    (chd_hnd_id, 'CMH 218', 'PRIMARY HEALTHCARE MANAGEMENT II', 2, 'HND', 1, true),
    (chd_hnd_id, 'CMH 221', 'USE OF STANDING ORDERS', 3, 'HND', 1, true),
    (chd_hnd_id, 'CMH 214', 'MATERNAL AND CHILD HEALTH', 4, 'HND', 1, true),
    (chd_hnd_id, 'CMH 203', 'COMMUNICABLE DISEASES I', 2, 'HND', 1, true),
    (chd_hnd_id, 'CMH 204', 'SOCIOLOGY OF THE FAMILY', 2, 'HND', 1, true),
    (chd_hnd_id, 'CMH 215', 'FAMILY PLANNING', 3, 'HND', 1, true),
    (chd_hnd_id, 'CMH 129', 'COMMUNITY BASED HEALTHCARE', 3, 'HND', 1, true),
    (chd_hnd_id, 'CMH 213', 'SOCIAL AND BEHAVIOURAL CHANGE COMMUNICATION', 3, 'HND', 1, true),
    (chd_hnd_id, 'GNS 228', 'RESEARCH METHODOLOGY', 2, 'HND', 1, true)
    ON CONFLICT (code) DO NOTHING;
END $$;

-- Semester II Courses
DO $$
DECLARE
    chd_hnd_id uuid;
BEGIN
    SELECT id INTO chd_hnd_id FROM public.programs WHERE slug = 'community-health-hnd';

    INSERT INTO public.courses (program_id, code, title, credit_units, level, semester, is_active) VALUES
    (chd_hnd_id, 'ENT 216', 'ENTREPRENEURSHIP/SMALL BUSINESS MANAGEMENT', 3, 'HND', 2, true),
    (chd_hnd_id, 'GNS 202', 'COMMUNICATION IN ENGLISH II', 2, 'HND', 2, true),
    (chd_hnd_id, 'GNS 213', 'MEDICAL SOCIOLOGY', 2, 'HND', 2, true),
    (chd_hnd_id, 'CMH 217', 'NON-COMMUNICABLE DISEASES', 2, 'HND', 2, true),
    (chd_hnd_id, 'CMH 227', 'HEALTH MANAGEMENT INFORMATION SYSTEM', 1, 'HND', 2, true),
    (chd_hnd_id, 'CMH 230', 'REFERRAL AND OUTREACH SERVICES', 2, 'HND', 2, true),
    (chd_hnd_id, 'CMH 220', 'SUPERVISED COMMUNITY BASED EXPERIENCE', 5, 'HND', 2, true),
    (chd_hnd_id, 'CMH 231', 'PROJECT', 6, 'HND', 2, true)
    ON CONFLICT (code) DO NOTHING;
END $$;

-- ============================================
-- COURSES FOR HEALTH TECHNICIAN ND
-- ============================================

-- Semester I Courses
DO $$
DECLARE
    ht_nd_id uuid;
BEGIN
    SELECT id INTO ht_nd_id FROM public.programs WHERE slug = 'health-technician-nd';

    INSERT INTO public.courses (program_id, code, title, credit_units, level, semester, is_active) VALUES
    (ht_nd_id, 'COM 115', 'COMPUTER APPLICATION PACKAGES', 3, 'ND', 1, true),
    (ht_nd_id, 'CMS 311', 'APPLIED ANATOMY AND PHYSIOLOGY I', 2, 'ND', 1, true),
    (ht_nd_id, 'CMH 315', 'DISASTER AND EMERGENCY MANAGEMENT', 2, 'ND', 1, true),
    (ht_nd_id, 'CMH 301', 'ENVIRONMENTAL MICROBIOLOGY', 1, 'ND', 1, true),
    (ht_nd_id, 'CMH 302', 'PARASITOLOGY', 2, 'ND', 1, true),
    (ht_nd_id, 'CMH 324', 'MEDICAL LABORATORY SCIENCE AND TECHNIQUES', 3, 'ND', 1, true),
    (ht_nd_id, 'CMH 308', 'PRIMARY HEALTHCARE MANAGEMENT III', 2, 'ND', 1, true),
    (ht_nd_id, 'GNS 302', 'COMMUNICATION IN ENGLISH III', 2, 'ND', 1, true)
    ON CONFLICT (code) DO NOTHING;
END $$;

-- Semester II Courses
DO $$
DECLARE
    ht_nd_id uuid;
BEGIN
    SELECT id INTO ht_nd_id FROM public.programs WHERE slug = 'health-technician-nd';

    INSERT INTO public.courses (program_id, code, title, credit_units, level, semester, is_active) VALUES
    (ht_nd_id, 'CMH 322', 'POPULATION DYNAMICS AND FAMILY PLANNING', 2, 'ND', 2, true),
    (ht_nd_id, 'CMH 325', 'COMMUNICABLE DISEASES II', 2, 'ND', 2, true),
    (ht_nd_id, 'CMS 312', 'APPLIED ANATOMY AND PHYSIOLOGY II', 2, 'ND', 2, true),
    (ht_nd_id, 'CMH 321', 'ADOLESCENT AND ADULT HEALTH', 2, 'ND', 2, true),
    (ht_nd_id, 'CMH 429', 'CARE OF HANDICAP', 2, 'ND', 2, true),
    (ht_nd_id, 'CMH 323', 'COMMUNITY GERIATRICS', 2, 'ND', 2, true),
    (ht_nd_id, 'PHN 313', 'DRUG SUPPLY, ADMINISTRATION AND CONTROL', 2, 'ND', 2, true),
    (ht_nd_id, 'CMH 328', 'RESEARCH METHODOLOGY', 2, 'ND', 2, true),
    (ht_nd_id, 'CMH 329', 'SEMINAR', 4, 'ND', 2, true)
    ON CONFLICT (code) DO NOTHING;
END $$;

-- ============================================
-- COURSES FOR HEALTH ASSISTANT ND
-- ============================================
-- Note: Specific course list for Health Assistant ND was not provided
-- This section can be populated when course details are available

-- ============================================
-- COURSES FOR PUBLIC HEALTH TECHNOLOGY HND
-- ============================================

-- Semester I Courses
DO $$
DECLARE
    pht_hnd_id uuid;
BEGIN
    SELECT id INTO pht_hnd_id FROM public.programs WHERE slug = 'public-health-technology-hnd';

    INSERT INTO public.courses (program_id, code, title, credit_units, level, semester, is_active) VALUES
    (pht_hnd_id, 'CMS 411', 'APPLIED ANATOMY AND PHYSIOLOGY III', 2, 'HND', 1, true),
    (pht_hnd_id, 'STC 222', 'INTRODUCTION TO BIOCHEMISTRY', 2, 'HND', 1, true),
    (pht_hnd_id, 'CMH 414', 'HEALTH/MEDICAL STATISTICS', 3, 'HND', 1, true),
    (pht_hnd_id, 'CMH 419', 'COMMUNITY HEALTH GEOGRAPHY', 2, 'HND', 1, true),
    (pht_hnd_id, 'CMH 316', 'MATERNAL AND CHILD HEALTH II', 5, 'HND', 1, true),
    (pht_hnd_id, 'CMH 425', 'OUTREACH AND REFERRAL PRACTICES II', 2, 'HND', 1, true),
    (pht_hnd_id, 'PHN 422', 'SCHOOL HEALTH PROGRAM', 2, 'HND', 1, true),
    (pht_hnd_id, 'CMH 424', 'COMMUNITY EYE CARE', 3, 'HND', 1, true)
    ON CONFLICT (code) DO NOTHING;
END $$;

-- Semester II Courses
DO $$
DECLARE
    pht_hnd_id uuid;
BEGIN
    SELECT id INTO pht_hnd_id FROM public.programs WHERE slug = 'public-health-technology-hnd';

    INSERT INTO public.courses (program_id, code, title, credit_units, level, semester, is_active) VALUES
    (pht_hnd_id, 'CMS 421', 'APPLIED ANATOMY AND PHYSIOLOGY IV', 2, 'HND', 2, true),
    (pht_hnd_id, 'CMS 423', 'COMMUNITY ENT', 3, 'HND', 2, true),
    (pht_hnd_id, 'CMH 427', 'NIGERIA HEALTH SYSTEM', 2, 'HND', 2, true),
    (pht_hnd_id, 'CMH 421', 'CLINICAL SKILLS II', 2, 'HND', 2, true),
    (pht_hnd_id, 'EHT 324', 'PUBLIC HEALTH ECONOMICS', 1, 'HND', 2, true),
    (pht_hnd_id, 'EHT 414', 'PUBLIC HEALTH LAWS', 1, 'HND', 2, true),
    (pht_hnd_id, 'PHN 323', 'MINOR SURGERY', 2, 'HND', 2, true),
    (pht_hnd_id, 'CMH 443', 'PROJECT', 6, 'HND', 2, true)
    ON CONFLICT (code) DO NOTHING;
END $$;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify the data was inserted correctly:
-- SELECT 
--     d.name as department,
--     p.title as program,
--     c.code,
--     c.title as course_title,
--     c.credit_units,
--     c.semester
-- FROM public.departments d
-- JOIN public.programs p ON p.department_id = d.id
-- JOIN public.courses c ON c.program_id = p.id
-- ORDER BY d.name, p.title, c.semester, c.code;