-- Fix the notify_timetable_session_created function to use correct column name

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_timetable_session_insert ON public.timetable_sessions;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.notify_timetable_session_created();

-- Recreate the function with correct column reference
CREATE OR REPLACE FUNCTION public.notify_timetable_session_created()
RETURNS TRIGGER AS $$
DECLARE
  session_record RECORD;
  student_record RECORD;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get the timetable session details
  SELECT s.name as session_name, sem.semester_name as semester_name, p.title as program_title
  INTO session_record
  FROM public.academic_sessions s
  JOIN public.academic_semesters sem ON NEW.semester_id = sem.id
  JOIN public.programs p ON NEW.program_id = p.id
  WHERE s.id = NEW.session_id;

  notification_title := 'New Timetable Published';
  notification_message := format('A new timetable has been published for %s %s - %s %s. Please check your timetable for your class schedule.', 
    session_record.session_name, session_record.semester_name, session_record.program_title, NEW.level || 'L');

  -- Notify all students enrolled in this program and level
  FOR student_record IN 
    SELECT sp.profile_id 
    FROM public.enrollments e
    JOIN public.student_profiles sp ON e.student_id = sp.profile_id
    WHERE e.program_id = NEW.program_id
    AND e.status = 'active'
    AND sp.current_level = NEW.level
  LOOP
    INSERT INTO public.student_notifications (student_id, title, message, notification_type, category, deep_link)
    VALUES (
      student_record.profile_id,
      notification_title,
      notification_message,
      'timetable',
      'academic',
      '/student/timetable'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_timetable_session_insert
  AFTER INSERT ON public.timetable_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_timetable_session_created();