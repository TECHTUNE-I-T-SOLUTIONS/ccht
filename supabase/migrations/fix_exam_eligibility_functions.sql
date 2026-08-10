-- Fix ambiguous column references in exam eligibility functions
-- This updates the functions to use prefixed parameter names to avoid ambiguity

-- Drop and recreate the exam eligibility function with fixed parameter names
DROP FUNCTION IF EXISTS public.check_student_exam_eligibility CASCADE;

CREATE OR REPLACE FUNCTION public.check_student_exam_eligibility(p_student_id uuid, p_course_id uuid, p_session_id uuid)
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

-- Drop and recreate the session eligibility function with fixed parameter names
DROP FUNCTION IF EXISTS public.check_student_session_eligibility CASCADE;

CREATE OR REPLACE FUNCTION public.check_student_session_eligibility(p_student_id uuid, p_session_id uuid)
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_student_exam_eligibility TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_student_session_eligibility TO authenticated;