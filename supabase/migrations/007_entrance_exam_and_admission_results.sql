-- Entrance exam persistence for aspirants.

BEGIN;

CREATE TABLE IF NOT EXISTS public.entrance_exam_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aspirant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_type text NOT NULL DEFAULT 'entrance',
  score numeric NOT NULL CHECK (score >= 0 AND score <= 100),
  total_questions integer NOT NULL CHECK (total_questions > 0),
  percentage numeric NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  grade text NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D', 'E', 'F')),
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  proctoring_snapshot jsonb,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'approved', 'rejected')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.admin_profiles(profile_id) ON DELETE SET NULL,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entrance_exam_results_aspirant_id ON public.entrance_exam_results(aspirant_id);
CREATE INDEX IF NOT EXISTS idx_entrance_exam_results_exam_type ON public.entrance_exam_results(exam_type);

ALTER TABLE public.entrance_exam_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS entrance_exam_results_select_own_or_admin ON public.entrance_exam_results;
CREATE POLICY entrance_exam_results_select_own_or_admin ON public.entrance_exam_results
  FOR SELECT USING (aspirant_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS entrance_exam_results_insert_own_or_admin ON public.entrance_exam_results;
CREATE POLICY entrance_exam_results_insert_own_or_admin ON public.entrance_exam_results
  FOR INSERT WITH CHECK (aspirant_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS entrance_exam_results_update_admin_only ON public.entrance_exam_results;
CREATE POLICY entrance_exam_results_update_admin_only ON public.entrance_exam_results
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Easy read-view for portals if needed.
CREATE OR REPLACE VIEW public.v_entrance_exam_results AS
SELECT *
FROM public.entrance_exam_results;

GRANT SELECT ON public.v_entrance_exam_results TO authenticated;

COMMIT;
