-- Create tables for timetable management
-- This allows admins and lecturers to create weekly timetables for courses

-- Create academic_sessions table if not exists (for reference)
-- This should already exist, but including for completeness

-- Create timetable_sessions (master timetable for a session/semester/program)
CREATE TABLE IF NOT EXISTS public.timetable_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  semester_id UUID NOT NULL REFERENCES public.academic_semesters(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  level VARCHAR(10) NOT NULL CHECK (level IN ('100', '200', '300', '400', '500')),
  title VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE(session_id, semester_id, program_id, level)
);

-- Create timetable_entries (individual class sessions)
CREATE TABLE IF NOT EXISTS public.timetable_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_session_id UUID NOT NULL REFERENCES public.timetable_sessions(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  venue VARCHAR(255),
  lecturer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_timetable_sessions_session_semester ON public.timetable_sessions(session_id, semester_id);
CREATE INDEX IF NOT EXISTS idx_timetable_sessions_program_level ON public.timetable_sessions(program_id, level);
CREATE INDEX IF NOT EXISTS idx_timetable_sessions_active ON public.timetable_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_timetable ON public.timetable_entries(timetable_session_id);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_course ON public.timetable_entries(course_id);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_day_time ON public.timetable_entries(day_of_week, start_time);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_lecturer ON public.timetable_entries(lecturer_id);

-- Add RLS policies
ALTER TABLE public.timetable_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;

-- Policies for timetable_sessions
CREATE POLICY "Admins can view all timetable sessions"
  ON public.timetable_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Lecturers can view timetable sessions for their courses"
  ON public.timetable_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.timetable_entries te
      JOIN public.courses c ON te.course_id = c.id
      WHERE te.timetable_session_id = public.timetable_sessions.id
      AND te.lecturer_id = auth.uid()
    )
  );

CREATE POLICY "Students can view timetable sessions for their program"
  ON public.timetable_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.student_id = auth.uid()
      AND e.program_id = public.timetable_sessions.program_id
      AND e.status = 'active'
    )
  );

CREATE POLICY "Admins can create timetable sessions"
  ON public.timetable_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update timetable sessions"
  ON public.timetable_sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete timetable sessions"
  ON public.timetable_sessions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for timetable_entries
CREATE POLICY "Admins can view all timetable entries"
  ON public.timetable_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Lecturers can view timetable entries for their courses"
  ON public.timetable_entries FOR SELECT
  TO authenticated
  USING (
    lecturer_id = auth.uid()
  );

CREATE POLICY "Students can view timetable entries for their program"
  ON public.timetable_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.timetable_sessions ts
      JOIN public.enrollments e ON e.program_id = ts.program_id
      WHERE ts.id = public.timetable_entries.timetable_session_id
      AND e.student_id = auth.uid()
      AND e.status = 'active'
    )
  );

CREATE POLICY "Admins can create timetable entries"
  ON public.timetable_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update timetable entries"
  ON public.timetable_entries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete timetable entries"
  ON public.timetable_entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_timetable_sessions_updated_at
  BEFORE UPDATE ON public.timetable_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timetable_entries_updated_at
  BEFORE UPDATE ON public.timetable_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to notify students when timetable is updated
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
  SELECT ts.*, s.name as session_name, sem.name as semester_name, p.title as program_title
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

-- Create triggers for timetable entries changes
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

-- Function to notify students when a new timetable session is created
CREATE OR REPLACE FUNCTION public.notify_timetable_session_created()
RETURNS TRIGGER AS $$
DECLARE
  session_record RECORD;
  student_record RECORD;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get the timetable session details
  SELECT s.name as session_name, sem.name as semester_name, p.title as program_title
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

-- Create trigger for timetable session creation
CREATE TRIGGER trigger_timetable_session_insert
  AFTER INSERT ON public.timetable_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_timetable_session_created();
