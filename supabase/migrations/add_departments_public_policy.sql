-- Enable RLS on departments table
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view active departments" ON public.departments;
DROP POLICY IF EXISTS "Public can view all departments" ON public.departments;

-- Create policy to allow public (unauthenticated) users to view active departments
CREATE POLICY "Public can view active departments"
  ON public.departments FOR SELECT
  USING (is_active = true);

-- Create policy to allow authenticated users to view all departments
CREATE POLICY "Authenticated can view all departments"
  ON public.departments FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create policy for admins to manage departments
CREATE POLICY "Admins can insert departments"
  ON public.departments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update departments"
  ON public.departments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete departments"
  ON public.departments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.profile_id = auth.uid()
    )
  );
