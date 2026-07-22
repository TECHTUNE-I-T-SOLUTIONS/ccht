-- Create lecturer_signup_links table for access code based signup

CREATE TABLE IF NOT EXISTS public.lecturer_signup_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  access_code TEXT NOT NULL UNIQUE,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lecturer_signup_links_access_code ON public.lecturer_signup_links(access_code);
CREATE INDEX IF NOT EXISTS idx_lecturer_signup_links_lecturer_id ON public.lecturer_signup_links(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_lecturer_signup_links_email ON public.lecturer_signup_links(email);

-- Enable RLS
ALTER TABLE public.lecturer_signup_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public to view signup links by access code"
  ON public.lecturer_signup_links FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to create signup links"
  ON public.lecturer_signup_links FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update signup links"
  ON public.lecturer_signup_links FOR UPDATE
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_lecturer_signup_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_lecturer_signup_links_updated_at
  BEFORE UPDATE ON public.lecturer_signup_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lecturer_signup_links_updated_at();