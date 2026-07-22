-- Fix infinite recursion in timetable RLS policies

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all timetable sessions" ON public.timetable_sessions;
DROP POLICY IF EXISTS "Lecturers can view timetable sessions for their courses" ON public.timetable_sessions;
DROP POLICY IF EXISTS "Students can view timetable sessions for their program" ON public.timetable_sessions;
DROP POLICY IF EXISTS "Admins can create timetable sessions" ON public.timetable_sessions;
DROP POLICY IF EXISTS "Admins can update timetable sessions" ON public.timetable_sessions;
DROP POLICY IF EXISTS "Admins can delete timetable sessions" ON public.timetable_sessions;

DROP POLICY IF EXISTS "Admins can view all timetable entries" ON public.timetable_entries;
DROP POLICY IF EXISTS "Lecturers can view timetable entries for their courses" ON public.timetable_entries;
DROP POLICY IF EXISTS "Students can view timetable entries for their program" ON public.timetable_entries;
DROP POLICY IF EXISTS "Admins can create timetable entries" ON public.timetable_entries;
DROP POLICY IF EXISTS "Admins can update timetable entries" ON public.timetable_entries;
DROP POLICY IF EXISTS "Admins can delete timetable entries" ON public.timetable_entries;

-- Create a helper function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policies for timetable_sessions using the helper function
CREATE POLICY "Admins can view all timetable sessions"
  ON public.timetable_sessions FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Lecturers can view timetable sessions for their courses"
  ON public.timetable_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.timetable_entries te
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
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update timetable sessions"
  ON public.timetable_sessions FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete timetable sessions"
  ON public.timetable_sessions FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Recreate policies for timetable_entries
CREATE POLICY "Admins can view all timetable entries"
  ON public.timetable_entries FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Lecturers can view timetable entries for their courses"
  ON public.timetable_entries FOR SELECT
  TO authenticated
  USING (lecturer_id = auth.uid());

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
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update timetable entries"
  ON public.timetable_entries FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete timetable entries"
  ON public.timetable_entries FOR DELETE
  TO authenticated
  USING (public.is_admin());