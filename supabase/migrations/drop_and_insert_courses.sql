-- Drop existing courses and insert new courses from course form
-- This will delete all existing courses and insert the new ones

-- Program IDs
-- Community Health - National Diploma: eab2876f-9b79-46d8-9d18-3c6a76c39c3f
-- Community Health - Higher National Diploma: 708f52a2-50e5-4f08-b4bf-6ded82756c34
-- Health Technician - National Diploma: 8803e9f2-01fc-474a-86cb-34112f1082be
-- Health Assistant - National Diploma: d42d9544-895d-4f23-8529-68455b7e7a32
-- Public Health Technology - Higher National Diploma: fb3c26f9-56d1-49c5-adfd-6fab89b3d6a0

-- Drop all existing courses (this will cascade to related tables)
DELETE FROM public.courses;

-- Insert new courses for Community Health - National Diploma I (100L)
-- Semester 1
INSERT INTO public.courses (code, title, credit_units, level, semester, program_id, created_at, updated_at) VALUES
('CMS 111', 'ANATOMY AND PHYSIOLOGY I', 4, '100', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('GNS 101', 'USE OF ENGLISH I', 2, '100', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('GNS 111', 'CITIZENSHIP EDUCATION', 2, '100', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 128', 'MICROBIOLOGY AND LABORATORY PRACTICES', 2, '100', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 113', 'ORAL HEALTHCARE', 2, '100', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMS 112', 'INTRODUCTION TO EPIDEMIOLOGY', 2, '100', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('BCH 111', 'GENERAL AND PHYSICAL CHEMISTRY', 1, '100', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CHE 114', 'HUMAN NUTRITION', 3, '100', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('EHT 111', 'INTRODUCTION TO ENVIRONMENTAL HEALTH', 2, '100', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CHE 118', 'INTRODUCTION TO PRIMARY HEALTHCARE', 2, '100', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CHE 123', 'SYMPTOMATOLOGY', 2, '100', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('COM 111', 'INTRODUCTION TO COMPUTER', 2, '100', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW());

-- Semester 2
INSERT INTO public.courses (code, title, credit_units, level, semester, program_id, created_at, updated_at) VALUES
('CMS 121', 'ANATOMY AND PHYSIOLOGY II', 2, '100', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 126', 'COMMUNITY MENTAL HEALTH', 2, '100', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('GNS 201', 'COMMUNICATION IN ENGLISH I', 2, '100', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 128', 'OCCUPATIONAL HEALTH AND SAFETY', 2, '100', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 122', 'CLINICAL SKILLS I', 4, '100', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('STA 224', 'BIOSTATISTICS', 2, '100', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 116', 'PHARMACOLOGY AND ESSENTIAL MEDICINE', 3, '100', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 121', 'ACCIDENT AND EMERGENCY', 2, '100', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 112', 'COMMUNITY HEALTH PROFESSIONAL ETHICS', 1, '100', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 124', 'REPRODUCTIVE HEALTH', 2, '100', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 125', 'IMMUNITY AND IMMUNIZATION', 4, '100', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 108', 'PRIMARY HEALTHCARE MANAGEMENT I', 2, '100', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 120', 'CLINICAL POSTING [SIWES]', 0, '100', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW());

-- Community Health - National Diploma II (200L)
-- Semester 1
INSERT INTO public.courses (code, title, credit_units, level, semester, program_id, created_at, updated_at) VALUES
('CMH 201', 'INTRODUCTION TO HOME AND RURAL ECONOMICS', 2, '200', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('HED 101', 'INTRODUCTION TO HEALTH EDUCATION', 2, '200', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 218', 'PRIMARY HEALTHCARE MANAGEMENT II', 2, '200', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 221', 'USE OF STANDING ORDERS', 3, '200', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 214', 'MATERNAL AND CHILD HEALTH', 4, '200', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 203', 'COMMUNICABLE DISEASES I', 2, '200', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 204', 'SOCIOLOGY OF THE FAMILY', 2, '200', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 215', 'FAMILY PLANNING', 3, '200', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 129', 'COMMUNITY BASED HEALTHCARE', 3, '200', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 213', 'SOCIAL AND BEHAVIOURAL CHANGE COMMUNICATION', 3, '200', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('GNS 228', 'RESEARCH METHODOLOGY', 2, '200', 1, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW());

-- Semester 2
INSERT INTO public.courses (code, title, credit_units, level, semester, program_id, created_at, updated_at) VALUES
('ENT 216', 'ENTREPRENEURSHIP/SMALL BUSINESS MANAGEMENT', 3, '200', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('GNS 202', 'COMMUNICATION IN ENGLISH II', 2, '200', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('GNS 213', 'MEDICAL SOCIOLOGY', 2, '200', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 217', 'NON-COMMUNICABLE DISEASES', 2, '200', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 227', 'HEALTH MANAGEMENT INFORMATION SYSTEM', 1, '200', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 230', 'REFERRAL AND OUTREACH SERVICES', 2, '200', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 220', 'SUPERVISED COMMUNITY BASED EXPERIENCE', 5, '200', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW()),
('CMH 231', 'PROJECT', 6, '200', 2, 'eab2876f-9b79-46d8-9d18-3c6a76c39c3f', NOW(), NOW());

-- Community Health - Higher National Diploma I (300L)
-- Semester 1
INSERT INTO public.courses (code, title, credit_units, level, semester, program_id, created_at, updated_at) VALUES
('COM 115', 'COMPUTER APPLICATION PACKAGES', 3, '300', 1, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMS 311', 'APPLIED ANATOMY AND PHYSIOLOGY I', 2, '300', 1, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMH 315', 'DISASTER AND EMERGENCY MANAGEMENT', 2, '300', 1, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMH 301', 'ENVIRONMENTAL MICROBIOLOGY', 1, '300', 1, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMH 302', 'PARASITOLOGY', 2, '300', 1, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMH 324', 'MEDICAL LABORATORY SCIENCE AND TECHNIQUES', 3, '300', 1, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMH 308', 'PRIMARY HEALTHCARE MANAGEMENT III', 2, '300', 1, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('GNS 302', 'COMMUNICATION IN ENGLISH III', 2, '300', 1, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW());

-- Semester 2
INSERT INTO public.courses (code, title, credit_units, level, semester, program_id, created_at, updated_at) VALUES
('CMH 322', 'PULATION DYNAMICS AND FAMILY PLANNING', 2, '300', 2, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMH 325', 'COMMUNICABLE DISEASES II', 2, '300', 2, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMS 312', 'APPLIED ANATOMY AND PHYSIOLOGY II', 2, '300', 2, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMH 321', 'ADOLESCENT AND ADULT HEALTH', 2, '300', 2, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMH 429', 'CARE OF HANDICAP', 2, '300', 2, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMH 323', 'COMMUNITY GERIATRICS', 2, '300', 2, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('PHN 313', 'DRUG SUPPLY, ADMINISTRATION AND CONTROL', 2, '300', 2, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMH 328', 'RESEARCH METHODOLOGY', 2, '300', 2, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMH 329', 'SEMINAR', 4, '300', 2, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW());

-- Community Health - Higher National Diploma II (400L)
-- Semester 1
INSERT INTO public.courses (code, title, credit_units, level, semester, program_id, created_at, updated_at) VALUES
('CMS 411', 'APPLIED ANATOMY AND PHYSIOLOGY III', 2, '400', 1, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('STC 222', 'INTRODUCTION TO BIOCHEMISTRY', 2, '400', 1, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMH 414', 'HEALTH/MEDICAL STATISTICS', 3, '400', 1, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMH 419', 'COMMUNITY HEALTH GEOGRAPHY', 2, '400', 1, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMH 316', 'MATERNAL AND CHILD HEALTH II', 5, '400', 1, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMH 425', 'OUTREACH AND REFERRAL PRACTICES II', 2, '400', 1, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('PHN 422', 'SCHOOL HEALTH PROGRAM', 2, '400', 1, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMH 424', 'COMMUNITY EYE CARE', 3, '400', 1, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW());

-- Semester 2
INSERT INTO public.courses (code, title, credit_units, level, semester, program_id, created_at, updated_at) VALUES
('CMS 421', 'APPLIED ANATOMY AND PHYSIOLOGY IV', 2, '400', 2, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMS 423', 'COMMUNITY ENT', 3, '400', 2, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMH 427', 'NIGERIA HEALTH SYSTEM', 2, '400', 2, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMH 421', 'CLINICAL SKILLS II', 2, '400', 2, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('EHT 324', 'PUBLIC HEALTH ECONOMICS', 1, '400', 2, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('EHT 414', 'PUBLIC HEALTH LAWS', 1, '400', 2, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('PHN 323', 'MINOR SURGERY', 2, '400', 2, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW()),
('CMH 443', 'PROJECT', 6, '400', 2, '708f52a2-50e5-4f08-b4bf-6ded82756c34', NOW(), NOW());
