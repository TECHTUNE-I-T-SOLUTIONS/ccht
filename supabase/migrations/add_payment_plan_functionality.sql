-- Add payment plan functionality for school fees
-- This enables 60%/40% payment split with installment tracking

-- Add payment plan tracking columns to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_plan_type text CHECK (payment_plan_type = ANY (ARRAY['full'::text, 'installment_1'::text, 'installment_2'::text])),
ADD COLUMN IF NOT EXISTS installment_number integer CHECK (installment_number = ANY (ARRAY[1, 2])),
ADD COLUMN IF NOT EXISTS payment_plan_id uuid,
ADD COLUMN IF NOT EXISTS due_date date;

-- Create payment_plans table to track overall payment plans
CREATE TABLE IF NOT EXISTS public.payment_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  enrollment_id uuid,
  session_id uuid,
  total_amount numeric NOT NULL,
  amount_paid numeric NOT NULL DEFAULT 0,
  amount_remaining numeric NOT NULL,
  plan_type text NOT NULL DEFAULT 'full' CHECK (plan_type = ANY (ARRAY['full'::text, 'installment'::text])),
  first_installment_amount numeric,
  first_installment_paid boolean DEFAULT false,
  first_installment_paid_at timestamp with time zone,
  second_installment_amount numeric,
  second_installment_paid boolean DEFAULT false,
  second_installment_paid_at timestamp with time zone,
  second_installment_due_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'partial'::text, 'completed'::text, 'overdue'::text])),
  is_late boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_plans_pkey PRIMARY KEY (id),
  CONSTRAINT payment_plans_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT payment_plans_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id),
  CONSTRAINT payment_plans_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.academic_sessions(id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_plans_student_id ON public.payment_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_enrollment_id ON public.payment_plans(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_session_id ON public.payment_plans(session_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_status ON public.payment_plans(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_plan_id ON public.payments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_plan_type ON public.payments(payment_plan_type);

-- Add foreign key constraint for payment_plan_id
ALTER TABLE public.payments 
ADD CONSTRAINT payments_payment_plan_id_fkey 
FOREIGN KEY (payment_plan_id) REFERENCES public.payment_plans(id) ON DELETE SET NULL;

-- Create function to update payment plan status
CREATE OR REPLACE FUNCTION update_payment_plan_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the payment plan when a payment is made
  IF NEW.payment_plan_id IS NOT NULL AND NEW.status = 'success' THEN
    UPDATE public.payment_plans
    SET 
      amount_paid = amount_paid + NEW.amount,
      amount_remaining = amount_remaining - NEW.amount,
      updated_at = now()
    WHERE id = NEW.payment_plan_id;
    
    -- Update installment-specific fields
    IF NEW.payment_plan_type = 'installment_1' THEN
      UPDATE public.payment_plans
      SET 
        first_installment_paid = true,
        first_installment_paid_at = NEW.paid_at,
        status = 'partial'
      WHERE id = NEW.payment_plan_id;
    ELSIF NEW.payment_plan_type = 'installment_2' THEN
      UPDATE public.payment_plans
      SET 
        second_installment_paid = true,
        second_installment_paid_at = NEW.paid_at,
        status = 'completed'
      WHERE id = NEW.payment_plan_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment status updates
DROP TRIGGER IF EXISTS on_payment_status_change ON public.payments;
CREATE TRIGGER on_payment_status_change
  AFTER UPDATE OF status ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_plan_status();

-- Create function to check for overdue payment plans
CREATE OR REPLACE FUNCTION check_overdue_payment_plans()
RETURNS void AS $$
BEGIN
  UPDATE public.payment_plans
  SET 
    status = 'overdue',
    updated_at = now()
  WHERE 
    plan_type = 'installment' 
    AND first_installment_paid = true 
    AND second_installment_paid = false 
    AND second_installment_due_date < current_date
    AND status != 'completed';
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on payment_plans
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payment_plans
CREATE POLICY "Students can view their own payment plans"
  ON public.payment_plans FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all payment plans"
  ON public.payment_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles
      WHERE admin_profiles.profile_id = auth.uid()
    )
  );

CREATE POLICY "System can insert payment plans"
  ON public.payment_plans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update payment plans"
  ON public.payment_plans FOR UPDATE
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.payment_plans IS 'Tracks payment plans for school fees, including installment payments (60%/40% split)';
COMMENT ON COLUMN public.payments.payment_plan_type IS 'Type of payment: full, installment_1 (60%), or installment_2 (40%)';
COMMENT ON COLUMN public.payments.installment_number IS 'Installment number: 1 for first payment (60%), 2 for second payment (40%)';
COMMENT ON COLUMN public.payments.due_date IS 'Due date for installment payments';
COMMENT ON COLUMN public.payment_plans.second_installment_due_date IS 'Due date for second installment (typically 1 month after first payment)';

-- Create function to check student exam eligibility
CREATE OR REPLACE FUNCTION check_student_exam_eligibility(p_student_id uuid, p_course_id uuid, p_session_id uuid)
RETURNS TABLE(
  is_eligible boolean,
  fees_paid boolean,
  courses_approved boolean,
  payment_status text,
  message text
) AS $$
DECLARE
  fees_complete boolean := false;
  courses_complete boolean := false;
  payment_status_text text := 'unknown';
  eligibility_message text := '';
BEGIN
  -- Check if student has completed fee payments for the session
  SELECT 
    CASE 
      WHEN payment_plans.status = 'completed' THEN true
      WHEN payment_plans.plan_type = 'full' AND payment_plans.amount_paid >= payment_plans.total_amount THEN true
      WHEN payment_plans.plan_type = 'installment' AND payment_plans.first_installment_paid = true AND payment_plans.second_installment_paid = true THEN true
      ELSE false
    END,
    payment_plans.status
  INTO fees_complete, payment_status_text
  FROM public.payment_plans
  WHERE 
    payment_plans.student_id = p_student_id 
    AND payment_plans.session_id = p_session_id
    AND payment_plans.status IN ('completed', 'partial')
  LIMIT 1;
  
  -- If no payment plan found, check for full payment directly
  IF fees_complete IS NULL THEN
    SELECT 
      CASE 
        WHEN COUNT(*) > 0 THEN true
        ELSE false
      END
    INTO fees_complete
    FROM public.payments
    WHERE 
      payments.student_id = p_student_id
      AND payments.status = 'success'
      AND payments.description LIKE '%' || (SELECT name FROM public.academic_sessions WHERE id = p_session_id) || '%';
      
    payment_status_text := CASE WHEN fees_complete THEN 'paid' ELSE 'unpaid' END;
  END IF;
  
  -- Check if student has approved course selections for the session
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN true
      ELSE false
    END
  INTO courses_complete
  FROM public.selected_courses
  WHERE 
    selected_courses.student_id = p_student_id
    AND selected_courses.course_id = p_course_id
    AND selected_courses.status = 'approved';
  
  -- Build eligibility message
  IF NOT fees_complete THEN
    eligibility_message := 'School fees must be paid before taking exams';
  ELSIF NOT courses_complete THEN
    eligibility_message := 'Course selection must be approved before taking exams';
  ELSE
    eligibility_message := 'Student is eligible to take exams';
  END IF;
  
  RETURN QUERY SELECT 
    (fees_complete AND courses_complete) as is_eligible,
    fees_complete as fees_paid,
    courses_complete as courses_approved,
    payment_status_text as payment_status,
    eligibility_message as message;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to check overall exam eligibility for a student in a session
CREATE OR REPLACE FUNCTION check_student_session_eligibility(p_student_id uuid, p_session_id uuid)
RETURNS TABLE(
  is_eligible boolean,
  fees_paid boolean,
  has_approved_courses boolean,
  approved_course_count integer,
  payment_status text,
  message text
) AS $$
DECLARE
  fees_complete boolean := false;
  approved_courses_count integer := 0;
  payment_status_text text := 'unknown';
  eligibility_message text := '';
BEGIN
  -- Check fee payment status
  SELECT 
    CASE 
      WHEN payment_plans.status = 'completed' THEN true
      WHEN payment_plans.plan_type = 'full' AND payment_plans.amount_paid >= payment_plans.total_amount THEN true
      WHEN payment_plans.plan_type = 'installment' AND payment_plans.first_installment_paid = true AND payment_plans.second_installment_paid = true THEN true
      ELSE false
    END,
    payment_plans.status
  INTO fees_complete, payment_status_text
  FROM public.payment_plans
  WHERE 
    payment_plans.student_id = p_student_id 
    AND payment_plans.session_id = p_session_id
  LIMIT 1;
  
  -- If no payment plan, check direct payments
  IF fees_complete IS NULL THEN
    SELECT 
      CASE 
        WHEN COUNT(*) > 0 THEN true
        ELSE false
      END
    INTO fees_complete
    FROM public.payments
    WHERE 
      payments.student_id = p_student_id
      AND payments.status = 'success';
      
    payment_status_text := CASE WHEN fees_complete THEN 'paid' ELSE 'unpaid' END;
  END IF;
  
  -- Count approved courses
  SELECT COUNT(*)
  INTO approved_courses_count
  FROM public.selected_courses
  WHERE 
    selected_courses.student_id = p_student_id
    AND selected_courses.status = 'approved';
  
  -- Build eligibility message
  IF NOT fees_complete THEN
    eligibility_message := 'School fees must be paid before taking exams';
  ELSIF approved_courses_count = 0 THEN
    eligibility_message := 'No approved courses found for this session';
  ELSE
    eligibility_message := 'Student is eligible to take exams for ' || approved_courses_count || ' approved course(s)';
  END IF;
  
  RETURN QUERY SELECT 
    (fees_complete AND approved_courses_count > 0) as is_eligible,
    fees_complete as fees_paid,
    (approved_courses_count > 0) as has_approved_courses,
    approved_courses_count as approved_course_count,
    payment_status_text as payment_status,
    eligibility_message as message;
END;
$$ LANGUAGE plpgsql;