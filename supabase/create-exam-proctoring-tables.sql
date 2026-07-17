-- Exam Proctoring System
-- Tracks violations, screen recordings, and proctoring logs for admin review

-- Table 1: Exam sessions (one record per exam attempt)
CREATE TABLE IF NOT EXISTS public.exam_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  aspirant_id uuid NOT NULL,
  exam_type text NOT NULL DEFAULT 'Entrance Examination',
  academic_year text NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  submitted_at timestamp with time zone,
  time_spent_seconds integer,
  score integer,
  total_questions integer,
  percentage numeric(5,2),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status = ANY (ARRAY['in_progress'::text, 'submitted'::text, 'timeout'::text, 'disqualified'::text])),
  disqualification_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exam_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT exam_sessions_aspirant_id_fkey FOREIGN KEY (aspirant_id) REFERENCES public.profiles(id)
);

-- Table 2: Proctoring violations (tab switches, fullscreen exits, etc.)
CREATE TABLE IF NOT EXISTS public.exam_violations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  violation_type text NOT NULL CHECK (violation_type = ANY (ARRAY['tab_switch'::text, 'fullscreen_exit'::text, 'visibility_change'::text, 'copy_paste_attempt'::text, 'devtools_open'::text, 'right_click'::text, 'multiple_persons'::text, 'no_face_detected'::text, 'suspicious_activity'::text, 'other'::text])),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])),
  details text,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  screenshot_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exam_violations_pkey PRIMARY KEY (id),
  CONSTRAINT exam_violations_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.exam_sessions(id) ON DELETE CASCADE
);

-- Table 3: Screen recordings (stored temporarily for admin review)
CREATE TABLE IF NOT EXISTS public.exam_recordings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  recording_url text,
  recording_duration_seconds integer,
  file_size_bytes bigint,
  storage_provider text NOT NULL DEFAULT 'cloudinary'::text,
  status text NOT NULL DEFAULT 'processing' CHECK (status = ANY (ARRAY['processing'::text, 'available'::text, 'expired'::text, 'deleted'::text])),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '30 days'::interval),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT exam_recordings_pkey PRIMARY KEY (id),
  CONSTRAINT exam_recordings_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.exam_sessions(id) ON DELETE CASCADE
);

-- Table 4: Proctoring configuration (admin can set violation thresholds)
CREATE TABLE IF NOT EXISTS public.exam_proctoring_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exam_type text NOT NULL DEFAULT 'Entrance Examination',
  max_violations integer NOT NULL DEFAULT 5,
  auto_submit_on_max_violations boolean NOT NULL DEFAULT true,
  record_screen boolean NOT NULL DEFAULT true,
  require_webcam boolean NOT NULL DEFAULT true,
  require_microphone boolean NOT NULL DEFAULT false,
  require_fullscreen boolean NOT NULL DEFAULT true,
  block_copy_paste boolean NOT NULL DEFAULT true,
  block_right_click boolean NOT NULL DEFAULT true,
  block_devtools boolean NOT NULL DEFAULT true,
  detect_tab_switch boolean NOT NULL DEFAULT true,
  detect_visibility_change boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exam_proctoring_config_pkey PRIMARY KEY (id)
);

-- Insert default proctoring config
INSERT INTO public.exam_proctoring_config (exam_type, max_violations, auto_submit_on_max_violations)
VALUES ('Entrance Examination', 5, true)
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exam_sessions_aspirant_id ON public.exam_sessions(aspirant_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON public.exam_sessions(status);
CREATE INDEX IF NOT EXISTS idx_exam_violations_session_id ON public.exam_violations(session_id);
CREATE INDEX IF NOT EXISTS idx_exam_violations_timestamp ON public.exam_violations(timestamp);
CREATE INDEX IF NOT EXISTS idx_exam_recordings_session_id ON public.exam_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_exam_recordings_expires_at ON public.exam_recordings(expires_at);

-- Enable Row Level Security
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_proctoring_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Aspirants can view their own sessions
CREATE POLICY "Aspirants can view own exam sessions" ON public.exam_sessions
  FOR SELECT USING (aspirant_id = auth.uid());

-- Aspirants can insert their own sessions
CREATE POLICY "Aspirants can create own exam sessions" ON public.exam_sessions
  FOR INSERT WITH CHECK (aspirant_id = auth.uid());

-- Aspirants can update their own sessions (for submission)
CREATE POLICY "Aspirants can update own exam sessions" ON public.exam_sessions
  FOR UPDATE USING (aspirant_id = auth.uid());

-- Admins can view all exam sessions
CREATE POLICY "Admins can view all exam sessions" ON public.exam_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can view all violations
CREATE POLICY "Admins can view all violations" ON public.exam_violations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Aspirants can view their own violations
CREATE POLICY "Aspirants can view own violations" ON public.exam_violations
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM public.exam_sessions
      WHERE aspirant_id = auth.uid()
    )
  );

-- Admins can view all recordings
CREATE POLICY "Admins can view all recordings" ON public.exam_recordings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Aspirants can view their own recordings
CREATE POLICY "Aspirants can view own recordings" ON public.exam_recordings
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM public.exam_sessions
      WHERE aspirant_id = auth.uid()
    )
  );

-- Everyone can view proctoring config
CREATE POLICY "Everyone can view proctoring config" ON public.exam_proctoring_config
  FOR SELECT USING (true);

-- Function to auto-delete expired recordings
CREATE OR REPLACE FUNCTION public.cleanup_expired_recordings()
RETURNS void AS $$
BEGIN
  UPDATE public.exam_recordings
  SET status = 'deleted', deleted_at = now()
  WHERE status = 'available'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.exam_sessions TO authenticated;
GRANT ALL ON public.exam_violations TO authenticated;
GRANT ALL ON public.exam_recordings TO authenticated;
GRANT SELECT ON public.exam_proctoring_config TO authenticated;

-- Notification function for exam events
CREATE OR REPLACE FUNCTION public.notify_exam_event()
RETURNS TRIGGER AS $$
DECLARE
  aspirant_name TEXT;
  admin_ids UUID[];
  admin_id UUID;
BEGIN
  -- Get aspirant name
  SELECT first_name || ' ' || last_name INTO aspirant_name
  FROM public.profiles
  WHERE id = NEW.aspirant_id;

  -- Get all admin IDs
  SELECT array_agg(id) INTO admin_ids
  FROM public.profiles
  WHERE role = 'admin';

  -- Create notifications for admins when exam is submitted (only if admins exist)
  IF NEW.status = 'submitted' AND admin_ids IS NOT NULL THEN
    FOREACH admin_id IN ARRAY admin_ids LOOP
      INSERT INTO public.admin_notifications (
        admin_id, title, message, notification_type, category, priority, deep_link
      ) VALUES (
        admin_id,
        'Exam Submitted',
        aspirant_name || ' has submitted their entrance exam. Score: ' || COALESCE(NEW.percentage::TEXT, 'N/A') || '%',
        'exam',
        'admission',
        'high',
        '/admin/exam-proctoring'
      );
    END LOOP;
  END IF;

  -- Create notification for aspirant
  IF NEW.status = 'submitted' THEN
    INSERT INTO public.aspirant_notifications (
      aspirant_id, title, message, notification_type, category, priority, deep_link
    ) VALUES (
      NEW.aspirant_id,
      'Exam Submitted Successfully',
      'Thank you for completing your entrance exam. Your results will be reviewed and your admission status will be updated. You will be notified via email and on this portal.',
      'exam',
      'admission',
      'high',
      '/aspirant/dashboard'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for exam session updates
CREATE TRIGGER notify_exam_event_trigger
  AFTER UPDATE OF status ON public.exam_sessions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'submitted')
  EXECUTE FUNCTION public.notify_exam_event();

-- Notification function for document uploads
CREATE OR REPLACE FUNCTION public.notify_document_upload()
RETURNS TRIGGER AS $$
DECLARE
  aspirant_name TEXT;
  admin_ids UUID[];
  admin_id UUID;
BEGIN
  -- Get aspirant name
  SELECT first_name || ' ' || last_name INTO aspirant_name
  FROM public.profiles
  WHERE id = NEW.uploaded_by;

  -- Get all admin IDs
  SELECT array_agg(id) INTO admin_ids
  FROM public.profiles
  WHERE role = 'admin';

  -- Create notifications for admins (only if admins exist)
  IF admin_ids IS NOT NULL THEN
    FOREACH admin_id IN ARRAY admin_ids LOOP
      INSERT INTO public.admin_notifications (
        admin_id, title, message, notification_type, category, priority, deep_link
      ) VALUES (
        admin_id,
        'New Document Uploaded',
        aspirant_name || ' has uploaded a new document: ' || NEW.document_type,
        'document',
        'admission',
        'normal',
        '/admin/admissions'
      );
    END LOOP;
  END IF;

  -- Create notification for aspirant
  INSERT INTO public.aspirant_notifications (
    aspirant_id, title, message, notification_type, category, priority
  ) VALUES (
    NEW.uploaded_by,
    'Document Uploaded',
    'Your document (' || NEW.document_type || ') has been uploaded successfully.',
    'document',
    'admission',
    'normal'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for document uploads
CREATE TRIGGER notify_document_upload_trigger
  AFTER INSERT ON public.admission_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_document_upload();

-- Notification function for violations
CREATE OR REPLACE FUNCTION public.notify_violation()
RETURNS TRIGGER AS $$
DECLARE
  admin_ids UUID[];
  admin_id UUID;
  session_aspirant_id UUID;
  aspirant_name TEXT;
BEGIN
  -- Get the aspirant ID and name from the session
  SELECT s.aspirant_id, p.first_name || ' ' || p.last_name INTO session_aspirant_id, aspirant_name
  FROM public.exam_sessions s
  JOIN public.profiles p ON p.id = s.aspirant_id
  WHERE s.id = NEW.session_id;

  -- Only notify for high and critical violations (only if admins exist)
  IF NEW.severity IN ('high', 'critical') THEN
    -- Get all admin IDs
    SELECT array_agg(id) INTO admin_ids
    FROM public.profiles
    WHERE role = 'admin';

    -- Create notifications for admins (only if admins exist)
    IF admin_ids IS NOT NULL THEN
      FOREACH admin_id IN ARRAY admin_ids LOOP
        INSERT INTO public.admin_notifications (
          admin_id, title, message, notification_type, category, priority, deep_link
        ) VALUES (
          admin_id,
          'Exam Violation Detected',
          'High/Critical violation during exam by ' || aspirant_name || ': ' || NEW.violation_type || ' - ' || COALESCE(NEW.details, 'No details'),
          'violation',
          'exam',
          'urgent',
          '/admin/exam-proctoring'
        );
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for violations
CREATE TRIGGER notify_violation_trigger
  AFTER INSERT ON public.exam_violations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_violation();

-- Function to update aspirant profile and notify on stage change
CREATE OR REPLACE FUNCTION public.notify_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  stage_message TEXT;
BEGIN
  -- Notify aspirant when stage changes
  IF OLD.current_stage IS DISTINCT FROM NEW.current_stage THEN
    -- Create appropriate message based on stage
    IF NEW.current_stage = 'exam' THEN
      stage_message := 'Your documents have been approved! You can now take the entrance exam.';
    ELSIF NEW.current_stage = 'admitted' THEN
      stage_message := 'Congratulations! You have been admitted. Please check your email for next steps.';
    ELSE
      stage_message := 'Your admission process has moved to: ' || NEW.current_stage;
    END IF;

    INSERT INTO public.aspirant_notifications (
      aspirant_id, title, message, notification_type, category, priority, deep_link
    ) VALUES (
      NEW.profile_id,
      'Admission Stage Updated',
      stage_message,
      'stage_change',
      'admission',
      'high',
      '/aspirant/dashboard'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for aspirant profile updates
DROP TRIGGER IF EXISTS notify_stage_change_trigger ON public.aspirant_profiles;
CREATE TRIGGER notify_stage_change_trigger
  AFTER UPDATE OF current_stage ON public.aspirant_profiles
  FOR EACH ROW
  WHEN (OLD.current_stage IS DISTINCT FROM NEW.current_stage)
  EXECUTE FUNCTION public.notify_stage_change();
