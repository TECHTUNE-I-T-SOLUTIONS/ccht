-- Aspirant academic results and supporting documents
-- Run after admissions/storage and notification migrations.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.aspirant_academic_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aspirant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  result_type text NOT NULL CHECK (result_type IN ('waec', 'neco', 'nabteb', 'diploma', 'hnd', 'ond', 'degree', 'other')),
  exam_year integer,
  examination_number text,
  candidate_name text,
  school_name text,
  is_combined boolean NOT NULL DEFAULT false,
  sittings_count integer NOT NULL DEFAULT 1 CHECK (sittings_count >= 1 AND sittings_count <= 2),
  grades jsonb NOT NULL DEFAULT '[]'::jsonb,
  result_files jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected', 'needs_correction')),
  verification_note text,
  reviewed_by uuid REFERENCES public.admin_profiles(profile_id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
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

CREATE OR REPLACE FUNCTION public.notify_aspirant_from_results_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_aspirant_notification(
      NEW.aspirant_id,
      'Academic results added',
      'Your school results have been saved and will be reviewed.',
      'results',
      'admission',
      '/aspirant/status',
      'normal',
      NEW.created_by
    );

    PERFORM public.notify_admins_about_aspirant(
      'Aspirant result submitted',
      'An aspirant submitted school results for review.',
      'admissions',
      '/admin/admissions',
      'normal',
      NEW.created_by
    );
  ELSIF TG_OP = 'UPDATE' AND COALESCE(OLD.verification_status, '') IS DISTINCT FROM COALESCE(NEW.verification_status, '') THEN
    PERFORM public.create_aspirant_notification(
      NEW.aspirant_id,
      'Academic results review updated',
      format('Your academic results are now %s.', NEW.verification_status),
      'results',
      'admission',
      '/aspirant/status',
      CASE WHEN NEW.verification_status = 'rejected' THEN 'high' ELSE 'normal' END,
      NEW.updated_by
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_aspirant_academic_results_notifications ON public.aspirant_academic_results;
CREATE TRIGGER trg_aspirant_academic_results_notifications
AFTER INSERT OR UPDATE OF verification_status ON public.aspirant_academic_results
FOR EACH ROW
EXECUTE FUNCTION public.notify_aspirant_from_results_change();

