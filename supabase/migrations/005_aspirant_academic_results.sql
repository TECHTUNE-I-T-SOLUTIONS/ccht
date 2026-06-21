-- Aspirant academic results and qualifications
-- Run after admissions/storage and notification migrations.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.aspirant_academic_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aspirant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  result_type text NOT NULL DEFAULT 'secondary' CHECK (result_type IN ('secondary', 'diploma', 'nce', 'hnd', 'degree', 'professional')),
  exam_body text NOT NULL CHECK (exam_body IN ('WAEC', 'NECO', 'NABTEB', 'IJMB', 'JUPEB', 'Diploma', 'Other')),
  exam_year integer,
  sitting_number integer NOT NULL DEFAULT 1 CHECK (sitting_number IN (1, 2)),
  is_combined boolean NOT NULL DEFAULT false,
  qualification_title text,
  institution_name text,
  result_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  file_bucket text DEFAULT 'admission-documents',
  file_path text,
  file_name text,
  file_mime_type text,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'needs_correction')),
  verification_note text,
  verified_by uuid REFERENCES public.admin_profiles(profile_id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aspirant_academic_results_aspirant ON public.aspirant_academic_results(aspirant_id);
CREATE INDEX IF NOT EXISTS idx_aspirant_academic_results_status ON public.aspirant_academic_results(verification_status);

ALTER TABLE public.aspirant_academic_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS aspirant_academic_results_select_own_or_admin ON public.aspirant_academic_results;
CREATE POLICY aspirant_academic_results_select_own_or_admin
ON public.aspirant_academic_results
FOR SELECT
USING (aspirant_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS aspirant_academic_results_insert_own_or_admin ON public.aspirant_academic_results;
CREATE POLICY aspirant_academic_results_insert_own_or_admin
ON public.aspirant_academic_results
FOR INSERT
WITH CHECK (aspirant_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS aspirant_academic_results_update_own_or_admin ON public.aspirant_academic_results;
CREATE POLICY aspirant_academic_results_update_own_or_admin
ON public.aspirant_academic_results
FOR UPDATE
USING (aspirant_id = auth.uid() OR public.is_admin())
WITH CHECK (aspirant_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS aspirant_academic_results_delete_admin ON public.aspirant_academic_results;
CREATE POLICY aspirant_academic_results_delete_admin
ON public.aspirant_academic_results
FOR DELETE
USING (public.is_admin());

DROP TRIGGER IF EXISTS set_updated_at_aspirant_academic_results ON public.aspirant_academic_results;
CREATE TRIGGER set_updated_at_aspirant_academic_results
BEFORE UPDATE ON public.aspirant_academic_results
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.notify_aspirant_from_result_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_aspirant_notification(
      NEW.aspirant_id,
      'Academic result received',
      format('Your %s result has been added to your admission file.', NEW.exam_body),
      'result',
      'admission',
      '/aspirant/status',
      'normal',
      NEW.created_by
    );

    PERFORM public.notify_admins_about_aspirant(
      'Academic result added',
      format('An aspirant added a %s academic result.', NEW.exam_body),
      'records',
      '/admin/admissions',
      'normal',
      NEW.created_by
    );
  ELSIF TG_OP = 'UPDATE' AND COALESCE(OLD.verification_status, '') IS DISTINCT FROM COALESCE(NEW.verification_status, '') THEN
    PERFORM public.create_aspirant_notification(
      NEW.aspirant_id,
      'Academic result review updated',
      format('Your %s result is now %s.', NEW.exam_body, NEW.verification_status),
      'result',
      'admission',
      '/aspirant/status',
      CASE WHEN NEW.verification_status = 'rejected' THEN 'high' ELSE 'normal' END,
      NEW.verified_by
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_aspirant_academic_results_notifications ON public.aspirant_academic_results;
CREATE TRIGGER trg_aspirant_academic_results_notifications
AFTER INSERT OR UPDATE OF verification_status ON public.aspirant_academic_results
FOR EACH ROW
EXECUTE FUNCTION public.notify_aspirant_from_result_change();

