-- Fix aspirant payment RLS policies and notification triggers
-- Run this after the main create_aspirant_payments.sql migration

-- Add UPDATE policies for admin to update application payments
DROP POLICY IF EXISTS "Admins can update all application payments" ON public.aspirant_application_payments;
CREATE POLICY "Admins can update all application payments"
  ON public.aspirant_application_payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.profile_id = auth.uid()
    )
  );

-- Add UPDATE policies for admin to update admission payments
DROP POLICY IF EXISTS "Admins can update all admission payments" ON public.aspirant_admission_payments;
CREATE POLICY "Admins can update all admission payments"
  ON public.aspirant_admission_payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.profile_id = auth.uid()
    )
  );

-- Update notification trigger functions to remove is_active checks
CREATE OR REPLACE FUNCTION public.notify_admin_payment()
RETURNS TRIGGER AS $$
DECLARE
  aspirant_name text;
  aspirant_email text;
  payment_type text;
BEGIN
  -- Get aspirant details
  SELECT 
    COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''),
    email
  INTO aspirant_name, aspirant_email
  FROM public.profiles
  WHERE id = NEW.aspirant_id;
  
  -- Determine payment type
  IF TG_TABLE_NAME = 'aspirant_application_payments' THEN
    payment_type := 'Application Fee';
  ELSIF TG_TABLE_NAME = 'aspirant_admission_payments' THEN
    payment_type := 'Admission Fee';
  END IF;
  
  -- Insert notification for all admins
  IF NEW.status = 'success' AND OLD.status != 'success' THEN
    INSERT INTO public.admin_notifications (
      admin_id,
      title,
      message,
      notification_type,
      category,
      deep_link,
      priority
    )
    SELECT 
      profile_id,
      'New ' || payment_type || ' Payment Received',
      aspirant_name || ' (' || aspirant_email || ') has successfully paid their ' || payment_type || '.',
      'payment',
      'payment',
      '/admin/payments',
      'normal'
    FROM public.admin_profiles;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.notify_document_upload()
RETURNS TRIGGER AS $$
DECLARE
  aspirant_name text;
  document_count integer;
BEGIN
  -- Get aspirant details
  SELECT 
    COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')
  INTO aspirant_name
  FROM public.profiles p
  WHERE p.id = NEW.uploaded_by;
  
  -- Count total documents for this aspirant
  SELECT COUNT(*)
  INTO document_count
  FROM public.admission_documents
  WHERE uploaded_by = NEW.uploaded_by;
  
  -- Notify aspirant
  INSERT INTO public.aspirant_notifications (
    aspirant_id,
    title,
    message,
    notification_type,
    category,
    deep_link,
    priority
  ) VALUES (
    NEW.uploaded_by,
    'Document Uploaded Successfully',
    'Your document has been uploaded and is pending verification. Total documents: ' || document_count,
    'document',
    'document',
    '/aspirant/dashboard',
    'normal'
  );
  
  -- Notify admins
  INSERT INTO public.admin_notifications (
    admin_id,
    title,
    message,
    notification_type,
    category,
    deep_link,
    priority
  )
  SELECT 
    profile_id,
    'New Document Uploaded',
    aspirant_name || ' has uploaded a new document for verification.',
    'document',
    'document',
    '/admin/admissions',
    'normal'
  FROM public.admin_profiles;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.notify_exam_completion()
RETURNS TRIGGER AS $$
DECLARE
  aspirant_name text;
  exam_score numeric;
  exam_grade text;
BEGIN
  -- Get aspirant details
  SELECT 
    COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')
  INTO aspirant_name
  FROM public.profiles p
  WHERE p.id = NEW.aspirant_id;
  
  exam_score := NEW.percentage;
  exam_grade := NEW.grade;
  
  -- Update completion status in aspirant_profiles
  UPDATE public.aspirant_profiles
  SET exam_completed = true,
      exam_completed_at = now(),
      exam_score = NEW.percentage,
      exam_grade = NEW.grade,
      current_stage = 'admission_fee'
  WHERE profile_id = NEW.aspirant_id;
  
  -- Notify aspirant
  INSERT INTO public.aspirant_notifications (
    aspirant_id,
    title,
    message,
    notification_type,
    category,
    deep_link,
    priority
  ) VALUES (
    NEW.aspirant_id,
    'Entrance Exam Submitted',
    'Your entrance exam has been submitted successfully. Score: ' || exam_score || '% (Grade: ' || exam_grade || '). Results are being reviewed.',
    'exam',
    'exam',
    '/aspirant/dashboard',
    'high'
  );
  
  -- Notify admins
  INSERT INTO public.admin_notifications (
    admin_id,
    title,
    message,
    notification_type,
    category,
    deep_link,
    priority
  )
  SELECT 
    profile_id,
    'Entrance Exam Submitted',
    aspirant_name || ' has completed the entrance exam. Score: ' || exam_score || '% (Grade: ' || exam_grade || ').',
    'exam',
    'exam',
    '/admin/screening',
    'high'
  FROM public.admin_profiles;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.notify_aspirant_migration()
RETURNS TRIGGER AS $$
DECLARE
  aspirant_name text;
  matric_num text;
BEGIN
  -- Get aspirant details
  SELECT 
    COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, ''),
    NEW.matric_number
  INTO aspirant_name, matric_num
  FROM public.profiles p
  WHERE p.id = NEW.profile_id;
  
  -- Notify aspirant
  INSERT INTO public.aspirant_notifications (
    aspirant_id,
    title,
    message,
    notification_type,
    category,
    deep_link,
    priority
  ) VALUES (
    NEW.profile_id,
    'Congratulations! Admission Accepted',
    'You have been successfully admitted! Your matric number is ' || matric_num || '. You can now access the student portal.',
    'admission',
    'admission',
    '/student/dashboard',
    'urgent'
  );
  
  -- Notify admins
  INSERT INTO public.admin_notifications (
    admin_id,
    title,
    message,
    notification_type,
    category,
    deep_link,
    priority
  )
  SELECT 
    profile_id,
    'New Student Migrated',
    aspirant_name || ' has been migrated to the student portal. Matric: ' || matric_num,
    'admission',
    'admission',
    '/admin/admissions',
    'normal'
  FROM public.admin_profiles;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
