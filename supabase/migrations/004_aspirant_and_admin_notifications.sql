-- Aspirant and admin notifications
-- Run after the base schema and admissions/storage migrations.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.aspirant_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aspirant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL DEFAULT 'general',
  category text NOT NULL DEFAULT 'general',
  deep_link text,
  is_read boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aspirant_notifications_aspirant ON public.aspirant_notifications(aspirant_id);
CREATE INDEX IF NOT EXISTS idx_aspirant_notifications_created_at ON public.aspirant_notifications(created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'admin_notifications_admin_id_fkey'
      AND conrelid = 'public.admin_notifications'::regclass
  ) THEN
    ALTER TABLE public.admin_notifications
      ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin ON public.admin_notifications(admin_id);

ALTER TABLE public.aspirant_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS aspirant_notifications_select_own ON public.aspirant_notifications;
CREATE POLICY aspirant_notifications_select_own
ON public.aspirant_notifications
FOR SELECT
USING (aspirant_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS aspirant_notifications_update_own ON public.aspirant_notifications;
CREATE POLICY aspirant_notifications_update_own
ON public.aspirant_notifications
FOR UPDATE
USING (aspirant_id = auth.uid() OR public.is_admin())
WITH CHECK (aspirant_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS aspirant_notifications_insert_admin ON public.aspirant_notifications;
CREATE POLICY aspirant_notifications_insert_admin
ON public.aspirant_notifications
FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS aspirant_notifications_delete_admin ON public.aspirant_notifications;
CREATE POLICY aspirant_notifications_delete_admin
ON public.aspirant_notifications
FOR DELETE
USING (public.is_admin());

-- Keep timestamps current
DROP TRIGGER IF EXISTS set_updated_at_aspirant_notifications ON public.aspirant_notifications;
CREATE TRIGGER set_updated_at_aspirant_notifications
BEFORE UPDATE ON public.aspirant_notifications
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Helper functions
CREATE OR REPLACE FUNCTION public.create_aspirant_notification(
  p_aspirant_id uuid,
  p_title text,
  p_message text,
  p_notification_type text DEFAULT 'general',
  p_category text DEFAULT 'general',
  p_deep_link text DEFAULT NULL,
  p_priority text DEFAULT 'normal',
  p_created_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.aspirant_notifications (
    aspirant_id, title, message, notification_type, category, deep_link, priority, created_by
  ) VALUES (
    p_aspirant_id, p_title, p_message, p_notification_type, p_category, p_deep_link, p_priority, p_created_by
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_admin_notification(
  p_admin_id uuid,
  p_title text,
  p_message text,
  p_notification_type text DEFAULT 'general',
  p_category text DEFAULT 'general',
  p_deep_link text DEFAULT NULL,
  p_priority text DEFAULT 'normal',
  p_created_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.admin_notifications (
    admin_id, title, message, notification_type, category, deep_link, priority, sent_by
  ) VALUES (
    p_admin_id, p_title, p_message, p_notification_type, p_category, p_deep_link, p_priority, p_created_by
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admins_about_aspirant(
  p_title text,
  p_message text,
  p_category text DEFAULT 'admissions',
  p_deep_link text DEFAULT NULL,
  p_priority text DEFAULT 'normal',
  p_created_by uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin uuid;
BEGIN
  FOR v_admin IN
    SELECT profile_id FROM public.admin_profiles
  LOOP
    PERFORM public.create_admin_notification(
      v_admin, p_title, p_message, 'admissions', p_category, p_deep_link, p_priority, p_created_by
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_aspirant_from_profile_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_aspirant_notification(
      NEW.profile_id,
      'Welcome to your admission portal',
      'Your application has been created. Please continue with your profile details.',
      'application',
      'admission',
      '/aspirant/dashboard',
      'normal',
      NEW.profile_id
    );

    PERFORM public.notify_admins_about_aspirant(
      'New aspirant signup',
      'A new aspirant has started the admission process.',
      'admissions',
      '/admin/admissions',
      'normal',
      NEW.profile_id
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF COALESCE(OLD.application_status, '') IS DISTINCT FROM COALESCE(NEW.application_status, '') THEN
      PERFORM public.create_aspirant_notification(
        NEW.profile_id,
        'Application status updated',
        format('Your application status is now %s.', NEW.application_status),
        'application',
        'admission',
        '/aspirant/status',
        'normal',
        NEW.profile_id
      );
    END IF;

    IF COALESCE(OLD.current_stage, '') IS DISTINCT FROM COALESCE(NEW.current_stage, '') THEN
      PERFORM public.create_aspirant_notification(
        NEW.profile_id,
        'Application progress updated',
        format('Your application moved to the %s stage.', NEW.current_stage),
        'progress',
        'admission',
        '/aspirant/dashboard',
        'normal',
        NEW.profile_id
      );
    END IF;

    IF COALESCE(OLD.review_feedback, '') IS DISTINCT FROM COALESCE(NEW.review_feedback, '') AND NEW.review_feedback IS NOT NULL THEN
      PERFORM public.create_aspirant_notification(
        NEW.profile_id,
        'Review feedback available',
        NEW.review_feedback,
        'review',
        'admission',
        '/aspirant/status',
        'high',
        NEW.reviewed_by
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_aspirant_from_document_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_aspirant_notification(
      NEW.uploaded_by,
      CASE
        WHEN NEW.document_type = 'passport_photo' THEN 'Passport uploaded'
        ELSE 'Document uploaded'
      END,
      CASE
        WHEN NEW.document_type = 'passport_photo' THEN 'Your passport photograph has been uploaded successfully.'
        ELSE format('Your %s has been uploaded and is awaiting review.', replace(NEW.document_type, '_', ' '))
      END,
      'document',
      'admission',
      '/aspirant/documents',
      'normal',
      NEW.uploaded_by
    );

    PERFORM public.notify_admins_about_aspirant(
      'New document uploaded',
      format('An aspirant uploaded %s.', replace(NEW.document_type, '_', ' ')),
      'admissions',
      '/admin/admissions',
      'normal',
      NEW.uploaded_by
    );
  ELSIF TG_OP = 'UPDATE' AND COALESCE(OLD.verification_status, '') IS DISTINCT FROM COALESCE(NEW.verification_status, '') THEN
    PERFORM public.create_aspirant_notification(
      NEW.uploaded_by,
      'Document review updated',
      format('Your %s was marked %s.', replace(NEW.document_type, '_', ' '), NEW.verification_status),
      'document',
      'admission',
      '/aspirant/documents',
      CASE WHEN NEW.verification_status = 'rejected' THEN 'high' ELSE 'normal' END,
      NEW.verified_by
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_aspirant_from_student_migration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_aspirant_notification(
      NEW.profile_id,
      'Admission approved',
      'Congratulations, your admission has been approved and your student record is being prepared.',
      'admission',
      'admission',
      '/aspirant/status',
      'high',
      NEW.profile_id
    );

    PERFORM public.notify_admins_about_aspirant(
      'Student record created',
      'An aspirant has been migrated into the student directory.',
      'records',
      '/admin/users',
      'normal',
      NEW.profile_id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Triggers
DROP TRIGGER IF EXISTS trg_aspirant_profiles_notifications ON public.aspirant_profiles;
CREATE TRIGGER trg_aspirant_profiles_notifications
AFTER INSERT OR UPDATE OF application_status, current_stage, review_feedback ON public.aspirant_profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_aspirant_from_profile_change();

DROP TRIGGER IF EXISTS trg_admission_documents_notifications ON public.admission_documents;
CREATE TRIGGER trg_admission_documents_notifications
AFTER INSERT OR UPDATE OF verification_status ON public.admission_documents
FOR EACH ROW
EXECUTE FUNCTION public.notify_aspirant_from_document_change();

DROP TRIGGER IF EXISTS trg_student_profiles_migration_notifications ON public.student_profiles;
CREATE TRIGGER trg_student_profiles_migration_notifications
AFTER INSERT ON public.student_profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_aspirant_from_student_migration();

