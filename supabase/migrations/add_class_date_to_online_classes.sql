-- Add class_date column to online_classes table
-- This allows teachers to schedule online classes for specific dates
-- while maintaining the day_of_week and time from the timetable

ALTER TABLE public.online_classes 
ADD COLUMN class_date date;

-- Add index for better performance on date queries
CREATE INDEX IF NOT EXISTS idx_online_classes_class_date 
ON public.online_classes USING btree (class_date);

-- Add comment to document the new column
COMMENT ON COLUMN public.online_classes.class_date IS 'The specific date for this online class session. Used in conjunction with day_of_week and time to schedule recurring classes on different dates.';
