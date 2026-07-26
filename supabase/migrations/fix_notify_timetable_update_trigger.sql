-- Fix the notify_timetable_update function to use correct column name for academic_semesters

-- Drop the existing triggers first
DROP TRIGGER IF EXISTS trigger_timetable_entry_insert ON public.timetable_entries;
DROP TRIGGER IF EXISTS trigger_timetable_entry_update ON public.timetable_entries;
DROP TRIGGER IF EXISTS trigger_timetable_entry_delete ON public.timetable_entries;

-- Drop the existing function
DROP FUNCTION IF EXISTS public.notify_timetable_update();

-- Recreate the function with correct column reference
CREATE OR REPLACE FUNCTION public.notify_timetable_update()
RETURNS TRIGGER AS $$
DECLARE
  session_record RECORD;
  student_record RECORD;
  teacher_record RECORD;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get the timetable session details
  SELECT ts.*, s.name as session_name, sem.semester_name as semester_name, p.title as program_title
  INTO session_record
  FROM public.timetable_sessions ts
  JOIN public.academic_sessions s ON ts.session_id = s.id
  JOIN public.academic_semesters sem ON ts.semester_id = sem.id
  JOIN public.programs p ON ts.program_id = p.id
  WHERE ts.id = NEW.timetable_session_id;

  -- Determine notification type and message based on operation
  IF TG_OP = 'INSERT' THEN
    notification_title := 'New Timetable Entry Added';
    notification_message := format('A new class has been added to your timetable for %s %s - %s %s. Please check your timetable for details.', 
      session_record.session_name, session_record.semester_name, session_record.program_title, session_record.level || 'L');
  ELSIF TG_OP = 'UPDATE' THEN
    notification_title := 'Timetable Entry Updated';
    notification_message := format('A class in your timetable has been updated for %s %s - %s %s. Please check your timetable for the latest changes.', 
      session_record.session_name, session_record.semester_name, session_record.program_title, session_record.level || 'L');
  ELSIF TG_OP = 'DELETE' THEN
    notification_title := 'Timetable Entry Removed';
    notification_message := format('A class has been removed from your timetable for %s %s - %s %s. Please check your timetable for the latest changes.', 
      session_record.session_name, session_record.semester_name, session_record.program_title, session_record.level || 'L');
  END IF;

  -- Notify all students enrolled in this program and level
  FOR student_record IN 
    SELECT sp.profile_id 
    FROM public.enrollments e
    JOIN public.student_profiles sp ON e.student_id = sp.profile_id
    WHERE e.program_id = session_record.program_id
    AND e.status = 'active'
    AND sp.current_level = session_record.level
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

  -- Notify the assigned lecturer if there is one
  IF NEW.lecturer_id IS NOT NULL THEN
    INSERT INTO public.teacher_notifications (teacher_id, title, message, notification_type, category, deep_link)
    VALUES (
      NEW.lecturer_id,
      notification_title,
      notification_message,
      'timetable',
      'academic',
      '/lecturer/timetable'
    );
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Recreate the triggers
CREATE TRIGGER trigger_timetable_entry_insert
  AFTER INSERT ON public.timetable_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_timetable_update();

CREATE TRIGGER trigger_timetable_entry_update
  AFTER UPDATE ON public.timetable_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_timetable_update();

CREATE TRIGGER trigger_timetable_entry_delete
  AFTER DELETE ON public.timetable_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_timetable_update();
