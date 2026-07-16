-- Create aspirant-specific payment tables
-- These tables are separate from student payments for better tracking and reporting

-- Aspirant application fee payments
CREATE TABLE public.aspirant_application_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  aspirant_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 6500,
  currency text NOT NULL DEFAULT 'NGN',
  payment_method text CHECK (payment_method = ANY (ARRAY['paystack'::text, 'bank_transfer'::text, 'cash'::text])),
  paystack_reference text UNIQUE,
  paystack_access_code text,
  provider_transaction_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'success'::text, 'failed'::text, 'abandoned'::text, 'refunded'::text])),
  description text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT aspirant_application_payments_pkey PRIMARY KEY (id),
  CONSTRAINT aspirant_application_payments_aspirant_id_fkey FOREIGN KEY (aspirant_id) REFERENCES public.profiles(id)
);

-- Aspirant admission fee payments
CREATE TABLE public.aspirant_admission_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  aspirant_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 30000,
  currency text NOT NULL DEFAULT 'NGN',
  payment_method text CHECK (payment_method = ANY (ARRAY['paystack'::text, 'bank_transfer'::text, 'cash'::text])),
  paystack_reference text UNIQUE,
  paystack_access_code text,
  provider_transaction_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'success'::text, 'failed'::text, 'abandoned'::text, 'refunded'::text])),
  description text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT aspirant_admission_payments_pkey PRIMARY KEY (id),
  CONSTRAINT aspirant_admission_payments_aspirant_id_fkey FOREIGN KEY (aspirant_id) REFERENCES public.profiles(id)
);

-- Aspirant payment events for webhooks and tracking
CREATE TABLE public.aspirant_payment_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_id uuid,
  payment_type text NOT NULL CHECK (payment_type = ANY (ARRAY['application'::text, 'admission'::text])),
  event_type text NOT NULL,
  provider text DEFAULT 'paystack'::text,
  provider_reference text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  signature text,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT aspirant_payment_events_pkey PRIMARY KEY (id)
);

-- Update aspirant_profiles to track payment stages
ALTER TABLE public.aspirant_profiles 
ADD COLUMN IF NOT EXISTS application_fee_paid boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS application_fee_paid_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS admission_fee_paid boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS admission_fee_paid_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS documents_uploaded boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS documents_uploaded_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS exam_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS exam_completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS exam_score numeric,
ADD COLUMN IF NOT EXISTS exam_grade text,
ADD COLUMN IF NOT EXISTS migration_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS migration_completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS matric_number text;

-- Create indexes for better query performance
CREATE INDEX idx_aspirant_application_payments_aspirant_id ON public.aspirant_application_payments(aspirant_id);
CREATE INDEX idx_aspirant_application_payments_status ON public.aspirant_application_payments(status);
CREATE INDEX idx_aspirant_application_payments_paystack_reference ON public.aspirant_application_payments(paystack_reference);

CREATE INDEX idx_aspirant_admission_payments_aspirant_id ON public.aspirant_admission_payments(aspirant_id);
CREATE INDEX idx_aspirant_admission_payments_status ON public.aspirant_admission_payments(status);
CREATE INDEX idx_aspirant_admission_payments_paystack_reference ON public.aspirant_admission_payments(paystack_reference);

CREATE INDEX idx_aspirant_payment_events_payment_id ON public.aspirant_payment_events(payment_id);
CREATE INDEX idx_aspirant_payment_events_payment_type ON public.aspirant_payment_events(payment_type);
CREATE INDEX idx_aspirant_payment_events_processed ON public.aspirant_payment_events(processed);

-- Add RLS policies
ALTER TABLE public.aspirant_application_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aspirant_admission_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aspirant_payment_events ENABLE ROW LEVEL SECURITY;

-- Policy for aspirant_application_payments
CREATE POLICY "Aspirants can view their own application payments"
  ON public.aspirant_application_payments FOR SELECT
  USING (aspirant_id = auth.uid());

CREATE POLICY "Aspirants can insert their own application payments"
  ON public.aspirant_application_payments FOR INSERT
  WITH CHECK (aspirant_id = auth.uid());

CREATE POLICY "Admins can view all application payments"
  ON public.aspirant_application_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all application payments"
  ON public.aspirant_application_payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.profile_id = auth.uid()
    )
  );

-- Policy for aspirant_admission_payments
CREATE POLICY "Aspirants can view their own admission payments"
  ON public.aspirant_admission_payments FOR SELECT
  USING (aspirant_id = auth.uid());

CREATE POLICY "Aspirants can insert their own admission payments"
  ON public.aspirant_admission_payments FOR INSERT
  WITH CHECK (aspirant_id = auth.uid());

CREATE POLICY "Admins can view all admission payments"
  ON public.aspirant_admission_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all admission payments"
  ON public.aspirant_admission_payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.profile_id = auth.uid()
    )
  );

-- Policy for aspirant_payment_events
CREATE POLICY "Admins can view all payment events"
  ON public.aspirant_payment_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.profile_id = auth.uid()
    )
  );

-- Function to update aspirant payment status
CREATE OR REPLACE FUNCTION public.update_aspirant_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' AND OLD.status != 'success' THEN
    NEW.paid_at = now();
    
    -- Update aspirant_profiles based on payment type
    IF TG_TABLE_NAME = 'aspirant_application_payments' THEN
      UPDATE public.aspirant_profiles
      SET application_fee_paid = true,
          application_fee_paid_at = now(),
          current_stage = 'documents'
      WHERE profile_id = NEW.aspirant_id;
    ELSIF TG_TABLE_NAME = 'aspirant_admission_payments' THEN
      UPDATE public.aspirant_profiles
      SET admission_fee_paid = true,
          admission_fee_paid_at = now(),
          current_stage = 'migration'
      WHERE profile_id = NEW.aspirant_id;
    END IF;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for payment status updates
CREATE TRIGGER update_application_payment_status
  AFTER UPDATE ON public.aspirant_application_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_aspirant_payment_status();

CREATE TRIGGER update_admission_payment_status
  AFTER UPDATE ON public.aspirant_admission_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_aspirant_payment_status();

-- Function to send notification to aspirant
CREATE OR REPLACE FUNCTION public.notify_aspirant()
RETURNS TRIGGER AS $$
DECLARE
  aspirant_email text;
BEGIN
  -- Get aspirant email
  SELECT email INTO aspirant_email
  FROM public.profiles
  WHERE id = NEW.aspirant_id;
  
  -- Insert notification for aspirant
  IF TG_TABLE_NAME = 'aspirant_application_payments' AND NEW.status = 'success' AND OLD.status != 'success' THEN
    INSERT INTO public.aspirant_notifications (
      aspirant_id,
      title,
      message,
      notification_type,
      category,
      deep_link,
      priority
    ) VALUES (
      NEW.aspirant_id,
      'Application Fee Payment Successful',
      'Your application fee payment of ₦6,500 has been received successfully. You can now proceed to upload your documents.',
      'payment',
      'payment',
      '/aspirant/dashboard',
      'high'
    );
  ELSIF TG_TABLE_NAME = 'aspirant_admission_payments' AND NEW.status = 'success' AND OLD.status != 'success' THEN
    INSERT INTO public.aspirant_notifications (
      aspirant_id,
      title,
      message,
      notification_type,
      category,
      deep_link,
      priority
    ) VALUES (
      NEW.aspirant_id,
      'Admission Fee Payment Successful',
      'Your admission fee payment of ₦30,000 has been received successfully. You can now accept your admission offer.',
      'payment',
      'payment',
      '/aspirant/dashboard',
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to send notification to admins
CREATE OR REPLACE FUNCTION public.notify_admin_payment()
RETURNS TRIGGER AS $$
DECLARE
  aspirant_name text;
  aspirant_email text;
  payment_type text;
BEGIN
  -- Get aspirant details
  SELECT 
    COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''),
    email
  INTO aspirant_name, aspirant_email
  FROM public.profiles
  WHERE id = NEW.aspirant_id;
  
  -- Determine payment type
  IF TG_TABLE_NAME = 'aspirant_application_payments' THEN
    payment_type := 'Application Fee';
  ELSIF TG_TABLE_NAME = 'aspirant_admission_payments' THEN
    payment_type := 'Admission Fee';
  END IF;
  
  -- Insert notification for all admins
  IF NEW.status = 'success' AND OLD.status != 'success' THEN
    INSERT INTO public.admin_notifications (
      admin_id,
      title,
      message,
      notification_type,
      category,
      deep_link,
      priority
    )
    SELECT 
      profile_id,
      'New ' || payment_type || ' Payment Received',
      aspirant_name || ' (' || aspirant_email || ') has successfully paid their ' || payment_type || '.',
      'payment',
      'payment',
      '/admin/payments',
      'normal'
    FROM public.admin_profiles;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for notifications
CREATE TRIGGER notify_aspirant_payment
  AFTER UPDATE ON public.aspirant_application_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_aspirant();

CREATE TRIGGER notify_aspirant_admission_payment
  AFTER UPDATE ON public.aspirant_admission_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_aspirant();

CREATE TRIGGER notify_admin_application_payment
  AFTER UPDATE ON public.aspirant_application_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_payment();

CREATE TRIGGER notify_admin_admission_payment
  AFTER UPDATE ON public.aspirant_admission_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_payment();

-- Function to notify on document upload
CREATE OR REPLACE FUNCTION public.notify_document_upload()
RETURNS TRIGGER AS $$
DECLARE
  aspirant_name text;
  document_count integer;
BEGIN
  -- Get aspirant details
  SELECT 
    COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')
  INTO aspirant_name
  FROM public.profiles p
  WHERE p.id = NEW.uploaded_by;
  
  -- Count total documents for this aspirant
  SELECT COUNT(*)
  INTO document_count
  FROM public.admission_documents
  WHERE uploaded_by = NEW.uploaded_by;
  
  -- Notify aspirant
  INSERT INTO public.aspirant_notifications (
    aspirant_id,
    title,
    message,
    notification_type,
    category,
    deep_link,
    priority
  ) VALUES (
    NEW.uploaded_by,
    'Document Uploaded Successfully',
    'Your document has been uploaded and is pending verification. Total documents: ' || document_count,
    'document',
    'document',
    '/aspirant/dashboard',
    'normal'
  );
  
  -- Notify admins
  INSERT INTO public.admin_notifications (
    admin_id,
    title,
    message,
    notification_type,
    category,
    deep_link,
    priority
  )
  SELECT 
    profile_id,
    'New Document Uploaded',
    aspirant_name || ' has uploaded a new document for verification.',
    'document',
    'document',
    '/admin/admissions',
    'normal'
  FROM public.admin_profiles;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for document upload notifications
CREATE TRIGGER notify_on_document_upload
  AFTER INSERT ON public.admission_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_document_upload();

-- Function to notify on exam completion
CREATE OR REPLACE FUNCTION public.notify_exam_completion()
RETURNS TRIGGER AS $$
DECLARE
  aspirant_name text;
  exam_score numeric;
  exam_grade text;
BEGIN
  -- Get aspirant details
  SELECT 
    COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')
  INTO aspirant_name
  FROM public.profiles p
  WHERE p.id = NEW.aspirant_id;
  
  exam_score := NEW.percentage;
  exam_grade := NEW.grade;
  
  -- Update completion status in aspirant_profiles
  UPDATE public.aspirant_profiles
  SET exam_completed = true,
      exam_completed_at = now(),
      exam_score = NEW.percentage,
      exam_grade = NEW.grade,
      current_stage = 'admission_fee'
  WHERE profile_id = NEW.aspirant_id;
  
  -- Notify aspirant
  INSERT INTO public.aspirant_notifications (
    aspirant_id,
    title,
    message,
    notification_type,
    category,
    deep_link,
    priority
  ) VALUES (
    NEW.aspirant_id,
    'Entrance Exam Submitted',
    'Your entrance exam has been submitted successfully. Score: ' || exam_score || '% (Grade: ' || exam_grade || '). Results are being reviewed.',
    'exam',
    'exam',
    '/aspirant/dashboard',
    'high'
  );
  
  -- Notify admins
  INSERT INTO public.admin_notifications (
    admin_id,
    title,
    message,
    notification_type,
    category,
    deep_link,
    priority
  )
  SELECT 
    profile_id,
    'Entrance Exam Submitted',
    aspirant_name || ' has completed the entrance exam. Score: ' || exam_score || '% (Grade: ' || exam_grade || ').',
    'exam',
    'exam',
    '/admin/screening',
    'high'
  FROM public.admin_profiles;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for exam completion notifications
CREATE TRIGGER notify_on_exam_completion
  AFTER INSERT ON public.entrance_exam_results
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_exam_completion();

-- Function to notify on admission acceptance/migration
CREATE OR REPLACE FUNCTION public.notify_aspirant_migration()
RETURNS TRIGGER AS $$
DECLARE
  aspirant_name text;
  matric_num text;
BEGIN
  -- Get aspirant details
  SELECT 
    COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, ''),
    NEW.matric_number
  INTO aspirant_name, matric_num
  FROM public.profiles p
  WHERE p.id = NEW.profile_id;
  
  -- Notify aspirant
  INSERT INTO public.aspirant_notifications (
    aspirant_id,
    title,
    message,
    notification_type,
    category,
    deep_link,
    priority
  ) VALUES (
    NEW.profile_id,
    'Congratulations! Admission Accepted',
    'You have been successfully admitted! Your matric number is ' || matric_num || '. You can now access the student portal.',
    'admission',
    'admission',
    '/student/dashboard',
    'urgent'
  );
  
  -- Notify admins
  INSERT INTO public.admin_notifications (
    admin_id,
    title,
    message,
    notification_type,
    category,
    deep_link,
    priority
  )
  SELECT 
    profile_id,
    'New Student Migrated',
    aspirant_name || ' has been migrated to the student portal. Matric: ' || matric_num,
    'admission',
    'admission',
    '/admin/admissions',
    'normal'
  FROM public.admin_profiles;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for admission migration notifications
CREATE TRIGGER notify_on_aspirant_migration
  AFTER UPDATE ON public.aspirant_profiles
  FOR EACH ROW
  WHEN (NEW.migration_completed = true AND OLD.migration_completed = false)
  EXECUTE FUNCTION public.notify_aspirant_migration();
