-- Create online_classes table for scheduling online classes with Google Meet links

CREATE TABLE IF NOT EXISTS public.online_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  meet_link TEXT NOT NULL,
  meet_link_display_name TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_online_classes_course ON public.online_classes(course_id);
CREATE INDEX IF NOT EXISTS idx_online_classes_teacher ON public.online_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_online_classes_day ON public.online_classes(day_of_week);
CREATE INDEX IF NOT EXISTS idx_online_classes_active ON public.online_classes(is_active) WHERE is_active = true;

-- Add trigger for updated_at
CREATE TRIGGER trg_online_classes_updated_at
  BEFORE UPDATE ON public.online_classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to notify teacher and students when online class is created/updated
CREATE OR REPLACE FUNCTION public.notify_online_class_update()
RETURNS TRIGGER AS $$
DECLARE
  course_record RECORD;
  student_record RECORD;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get course details
  SELECT c.code, c.title INTO course_record
  FROM public.courses c
  WHERE c.id = NEW.course_id;

  -- Determine notification type and message based on operation
  IF TG_OP = 'INSERT' THEN
    notification_title := 'New Online Class Scheduled';
    notification_message := format('A new online class has been scheduled for %s - %s on %s from %s to %s. Google Meet link: %s', 
      course_record.code, course_record.title, NEW.day_of_week, 
      NEW.start_time::text, NEW.end_time::text, NEW.meet_link);
  ELSIF TG_OP = 'UPDATE' THEN
    notification_title := 'Online Class Updated';
    notification_message := format('The online class for %s - %s on %s has been updated. Google Meet link: %s', 
      course_record.code, course_record.title, NEW.day_of_week, NEW.meet_link);
  ELSIF TG_OP = 'DELETE' THEN
    notification_title := 'Online Class Cancelled';
    notification_message := format('The online class for %s - %s on %s has been cancelled.', 
      course_record.code, course_record.title, NEW.day_of_week);
  END IF;

  -- Notify the teacher
  INSERT INTO public.teacher_notifications (teacher_id, title, message, notification_type, category, deep_link)
  VALUES (
    NEW.teacher_id,
    notification_title,
    notification_message,
    'online_class',
    'academic',
    '/teacher/online-classes'
  );

  -- Notify all students enrolled in this course
  FOR student_record IN 
    SELECT sp.profile_id 
    FROM public.enrollments e
    JOIN public.student_profiles sp ON e.student_id = sp.profile_id
    JOIN public.course_teacher_assignments cta ON cta.course_id = NEW.course_id
    WHERE e.program_id IN (
      SELECT program_id FROM public.courses WHERE id = NEW.course_id
    )
    AND e.status = 'active'
    AND sp.current_level IN (
      SELECT level FROM public.courses WHERE id = NEW.course_id
    )
  LOOP
    INSERT INTO public.student_notifications (student_id, title, message, notification_type, category, deep_link)
    VALUES (
      student_record.profile_id,
      notification_title,
      notification_message,
      'online_class',
      'academic',
      '/student/online-classes'
    );
  END LOOP;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for online_classes changes
CREATE TRIGGER trigger_online_class_insert
  AFTER INSERT ON public.online_classes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_online_class_update();

CREATE TRIGGER trigger_online_class_update
  AFTER UPDATE ON public.online_classes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_online_class_update();

CREATE TRIGGER trigger_online_class_delete
  AFTER DELETE ON public.online_classes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_online_class_update();

-- Add RLS policies
ALTER TABLE public.online_classes ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can see their own online classes
CREATE POLICY "Teachers can view own online classes"
  ON public.online_classes FOR SELECT
  USING (auth.uid() = teacher_id);

-- Policy: Teachers can insert their own online classes
CREATE POLICY "Teachers can insert own online classes"
  ON public.online_classes FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

-- Policy: Teachers can update their own online classes
CREATE POLICY "Teachers can update own online classes"
  ON public.online_classes FOR UPDATE
  USING (auth.uid() = teacher_id);

-- Policy: Teachers can delete their own online classes
CREATE POLICY "Teachers can delete own online classes"
  ON public.online_classes FOR DELETE
  USING (auth.uid() = teacher_id);

-- Policy: Students can view online classes for their enrolled courses
CREATE POLICY "Students can view enrolled online classes"
  ON public.online_classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.student_profiles sp ON e.student_id = sp.profile_id
      WHERE e.program_id IN (
        SELECT program_id FROM public.courses WHERE id = online_classes.course_id
      )
      AND e.status = 'active'
      AND sp.current_level IN (
        SELECT level FROM public.courses WHERE id = online_classes.course_id
      )
      AND sp.profile_id = auth.uid()
    )
  );
