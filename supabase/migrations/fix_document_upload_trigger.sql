-- Fix FOREACH expression null error in notify_document_upload trigger function
-- This error occurs when there are no admin profiles in the database

CREATE OR REPLACE FUNCTION public.notify_document_upload()
RETURNS TRIGGER AS $$
DECLARE
  aspirant_name text;
  document_count integer;
  v_admin_count integer;
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
  
  -- Check if any admins exist before trying to notify them
  SELECT COUNT(*) INTO v_admin_count FROM public.admin_profiles;
  
  IF v_admin_count > 0 THEN
    -- Notify admins only if they exist
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
  ELSE
    -- Log a warning if no admins exist but don't fail
    RAISE WARNING 'No admin profiles found to notify about document upload';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
