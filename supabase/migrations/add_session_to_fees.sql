-- Add session_id column to fees table
ALTER TABLE public.fees 
ADD COLUMN session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_fees_session_id ON public.fees(session_id);

-- Add comment to document the new column
COMMENT ON COLUMN public.fees.session_id IS 'Academic session this fee is associated with';
