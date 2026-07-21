-- Fix RLS policies for exam_recordings table
-- This migration enables proper access control for exam recordings

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own exam recordings" ON exam_recordings;
DROP POLICY IF EXISTS "Users can insert their own exam recordings" ON exam_recordings;
DROP POLICY IF EXISTS "Users can update their own exam recordings" ON exam_recordings;
DROP POLICY IF EXISTS "Users can delete their own exam recordings" ON exam_recordings;
DROP POLICY IF EXISTS "Admins can view all exam recordings" ON exam_recordings;
DROP POLICY IF EXISTS "Admins can update all exam recordings" ON exam_recordings;
DROP POLICY IF EXISTS "Admins can delete all exam recordings" ON exam_recordings;

-- Enable RLS on exam_recordings table
ALTER TABLE exam_recordings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view recordings for their own exam sessions
CREATE POLICY "Users can view their own exam recordings"
ON exam_recordings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM exam_sessions
    WHERE exam_sessions.id = exam_recordings.session_id
    AND exam_sessions.aspirant_id = auth.uid()
  )
);

-- Policy: Users can insert recordings for their own exam sessions
CREATE POLICY "Users can insert their own exam recordings"
ON exam_recordings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM exam_sessions
    WHERE exam_sessions.id = exam_recordings.session_id
    AND exam_sessions.aspirant_id = auth.uid()
  )
);

-- Policy: Users can update their own exam recordings
CREATE POLICY "Users can update their own exam recordings"
ON exam_recordings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM exam_sessions
    WHERE exam_sessions.id = exam_recordings.session_id
    AND exam_sessions.aspirant_id = auth.uid()
  )
);

-- Policy: Users can delete their own exam recordings
CREATE POLICY "Users can delete their own exam recordings"
ON exam_recordings FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM exam_sessions
    WHERE exam_sessions.id = exam_recordings.session_id
    AND exam_sessions.aspirant_id = auth.uid()
  )
);

-- Policy: Admins can view all exam recordings
CREATE POLICY "Admins can view all exam recordings"
ON exam_recordings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Admins can update all exam recordings
CREATE POLICY "Admins can update all exam recordings"
ON exam_recordings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Admins can delete all exam recordings
CREATE POLICY "Admins can delete all exam recordings"
ON exam_recordings FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON exam_recordings TO authenticated, anon;
