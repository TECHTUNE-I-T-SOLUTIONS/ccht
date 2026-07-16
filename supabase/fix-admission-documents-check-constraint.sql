-- Fix admission_documents check constraint to include medical_fitness
-- Run this in your Supabase SQL editor
-- The original constraint was missing 'medical_fitness' which caused:
-- "new row for relation \"admission_documents\" violates check constraint \"admission_documents_document_type_check\""

ALTER TABLE public.admission_documents
  DROP CONSTRAINT IF EXISTS admission_documents_document_type_check,
  ADD CONSTRAINT admission_documents_document_type_check
    CHECK (
      document_type = ANY (ARRAY[
        'passport_photo'::text,
        'signature'::text,
        'birth_certificate'::text,
        'medical_fitness'::text,
        'age_declaration'::text,
        'primary_certificate'::text,
        'secondary_certificate'::text,
        'indigene_certificate'::text,
        'nin_slip'::text,
        'jamb_result'::text,
        'jamb_registration_form'::text,
        'other'::text
      ])
    );

-- Verify the constraint was applied
SELECT
  tc.constraint_name,
  tc.table_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'admission_documents'
  AND tc.constraint_type = 'CHECK';