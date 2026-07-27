-- Enable RLS on contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow public to insert contact messages (no authentication required)
CREATE POLICY "Allow public to insert contact messages"
  ON public.contact_messages FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to read contact messages
CREATE POLICY "Allow public to read contact messages"
  ON public.contact_messages FOR SELECT
  TO public
  USING (true);

-- Allow admins to manage all contact messages
CREATE POLICY "Admins can view all contact messages"
  ON public.contact_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete contact messages"
  ON public.contact_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE profile_id = auth.uid()
    )
  );

-- ============================================================
-- 4. Notify admins when new contact messages arrive
-- ============================================================

-- Create trigger to fire after insert on contact_messages
DROP TRIGGER IF EXISTS trg_notify_admins_contact_message ON public.contact_messages;

CREATE TRIGGER trg_notify_admins_contact_message
  AFTER INSERT ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_notification_events();
