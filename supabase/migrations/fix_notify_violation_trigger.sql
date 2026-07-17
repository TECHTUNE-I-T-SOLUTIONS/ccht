-- Fix FOREACH expression null error in notify_violation trigger
-- The issue is that array_agg can return NULL when there are no admins

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

  -- Only notify for high and critical violations
  IF NEW.severity IN ('high', 'critical') THEN
    -- Get all admin IDs (use COALESCE to ensure we get an empty array instead of NULL)
    SELECT COALESCE(array_agg(id), ARRAY[]::UUID[]) INTO admin_ids
    FROM public.profiles
    WHERE role = 'admin';

    -- Create notifications for admins (only if admins exist)
    IF array_length(admin_ids, 1) > 0 THEN
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
