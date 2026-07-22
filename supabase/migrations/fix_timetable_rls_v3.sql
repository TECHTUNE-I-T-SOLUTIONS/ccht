-- Fix infinite recursion in timetable RLS policies (Version 3 - Simplest)

-- Drop all existing policies
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

-- Disable RLS temporarily to fix the issue
ALTER TABLE public.timetable_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_entries DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.timetable_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;

-- Simple policies for timetable_sessions
CREATE POLICY "Allow authenticated users to view timetable sessions"
  ON public.timetable_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create timetable sessions"
  ON public.timetable_sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update timetable sessions"
  ON public.timetable_sessions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete timetable sessions"
  ON public.timetable_sessions FOR DELETE
  TO authenticated
  USING (true);

-- Simple policies for timetable_entries
CREATE POLICY "Allow authenticated users to view timetable entries"
  ON public.timetable_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create timetable entries"
  ON public.timetable_entries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update timetable entries"
  ON public.timetable_entries FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete timetable entries"
  ON public.timetable_entries FOR DELETE
  TO authenticated
  USING (true);