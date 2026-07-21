-- Create selected_courses table
CREATE TABLE IF NOT EXISTS public.selected_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
  session VARCHAR(20) NOT NULL DEFAULT '2026/2027',
  semester VARCHAR(20) NOT NULL DEFAULT 'first',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID REFERENCES public.admin_profiles(profile_id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id, session, semester)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_selected_courses_student_id ON public.selected_courses(student_id);
CREATE INDEX IF NOT EXISTS idx_selected_courses_course_id ON public.selected_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_selected_courses_status ON public.selected_courses(status);
CREATE INDEX IF NOT EXISTS idx_selected_courses_session_semester ON public.selected_courses(session, semester);

-- Enable RLS
ALTER TABLE public.selected_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can view their own selected courses
CREATE POLICY "Students can view own selected courses"
  ON public.selected_courses FOR SELECT
  USING (student_id = auth.uid());

-- Students can insert their own selected courses (only when status is pending)
CREATE POLICY "Students can insert own selected courses"
  ON public.selected_courses FOR INSERT
  WITH CHECK (
    student_id = auth.uid() AND 
    status = 'pending'
  );

-- Students can update their own selected courses (only before approval)
CREATE POLICY "Students can update own pending selected courses"
  ON public.selected_courses FOR UPDATE
  USING (
    student_id = auth.uid() AND 
    status = 'pending'
  );

-- Students can delete their own selected courses (only before approval)
CREATE POLICY "Students can delete own pending selected courses"
  ON public.selected_courses FOR DELETE
  USING (
    student_id = auth.uid() AND 
    status = 'pending'
  );

-- Admins can view all selected courses
CREATE POLICY "Admins can view all selected courses"
  ON public.selected_courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles 
      WHERE profile_id = auth.uid()
    )
  );

-- Admins can update status of selected courses
CREATE POLICY "Admins can update selected courses status"
  ON public.selected_courses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles 
      WHERE profile_id = auth.uid()
    )
  );

-- Teachers can view selected courses for their programs
CREATE POLICY "Teachers can view selected courses for their programs"
  ON public.selected_courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      JOIN public.departments d ON d.name = tp.department
      JOIN public.programs p ON p.department_id = d.id
      JOIN public.courses c ON c.program_id = p.id
      WHERE tp.profile_id = auth.uid() AND selected_courses.course_id = c.id
    )
  );

-- Teachers can update status of selected courses for their programs
CREATE POLICY "Teachers can update selected courses status for their programs"
  ON public.selected_courses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_profiles tp
      JOIN public.departments d ON d.name = tp.department
      JOIN public.programs p ON p.department_id = d.id
      JOIN public.courses c ON c.program_id = p.id
      WHERE tp.profile_id = auth.uid() AND selected_courses.course_id = c.id
    )
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_selected_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER selected_courses_updated_at
  BEFORE UPDATE ON public.selected_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_selected_courses_updated_at();

-- Trigger to notify student when course selection is approved
CREATE OR REPLACE FUNCTION notify_course_selection_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    INSERT INTO public.student_notifications (
      student_id,
      title,
      message,
      notification_type,
      category,
      deep_link,
      is_read,
      sent_by,
      created_at,
      updated_at
    )
    VALUES (
      NEW.student_id,
      'Course Selection Approved',
      'Your course selection for ' || NEW.session || ' ' || NEW.semester || ' semester has been approved.',
      'course_selection',
      'academics',
      '/student/course-form',
      false,
      NEW.reviewed_by,
      NOW(),
      NOW()
    );
  END IF;
  
  IF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO public.student_notifications (
      student_id,
      title,
      message,
      notification_type,
      category,
      deep_link,
      is_read,
      sent_by,
      created_at,
      updated_at
    )
    VALUES (
      NEW.student_id,
      'Course Selection Rejected',
      'Your course selection for ' || NEW.session || ' ' || NEW.semester || ' semester has been rejected. ' || COALESCE(NEW.review_notes, 'Please contact your department for more information.'),
      'course_selection',
      'alert',
      '/student/courses',
      false,
      NEW.reviewed_by,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER course_selection_status_change
  AFTER UPDATE ON public.selected_courses
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_course_selection_approved();

-- Trigger to notify admin/teacher when student submits course selection
CREATE OR REPLACE FUNCTION notify_course_selection_submitted()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify admins
  INSERT INTO public.admin_notifications (
    admin_id,
    title,
    message,
    notification_type,
    category,
    deep_link,
    is_read,
    sent_by,
    created_at,
    updated_at
  )
  SELECT 
    ap.profile_id,
    'New Course Selection Submitted',
    'A student has submitted their course selection for ' || NEW.session || ' ' || NEW.semester || ' semester.',
    'course_selection',
    'administrative',
    '/admin/students',
    false,
    NEW.student_id,
    NOW(),
    NOW()
  FROM public.admin_profiles ap
  WHERE ap.profile_id IS NOT NULL
  LIMIT 1;
  
  -- Notify teachers for the course's department
  INSERT INTO public.teacher_notifications (
    teacher_id,
    title,
    message,
    notification_type,
    category,
    deep_link,
    is_read,
    sent_by,
    created_at,
    updated_at
  )
  SELECT 
    tp.profile_id,
    'New Course Selection Submitted',
    'A student has submitted their course selection for ' || NEW.session || ' ' || NEW.semester || ' semester.',
    'course_selection',
    'academics',
    '/teacher/students',
    false,
    NEW.student_id,
    NOW(),
    NOW()
  FROM public.teacher_profiles tp
  JOIN public.departments d ON d.name = tp.department
  JOIN public.programs p ON p.department_id = d.id
  JOIN public.courses c ON c.program_id = p.id
  WHERE c.id = NEW.course_id
  LIMIT 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER course_selection_submitted
  AFTER INSERT ON public.selected_courses
  FOR EACH ROW
  EXECUTE FUNCTION notify_course_selection_submitted();
