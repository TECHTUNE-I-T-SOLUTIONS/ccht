-- Seed academic sessions for the admission system
-- This file can be run multiple times safely (uses ON CONFLICT DO NOTHING)

INSERT INTO public.academic_sessions (name, starts_on, ends_on, is_current, is_active) VALUES
  ('2024/2025', '2024-09-01', '2025-07-31', false, true),
  ('2025/2026', '2025-09-01', '2026-07-31', true, true),
  ('2026/2027', '2026-09-01', '2027-07-31', false, true),
  ('2027/2028', '2027-09-01', '2028-07-31', false, true),
  ('2028/2029', '2028-09-01', '2029-07-31', false, true)
ON CONFLICT (name) DO NOTHING;

-- Verify the data
SELECT 
  id,
  name,
  starts_on,
  ends_on,
  is_current,
  is_active,
  created_at
FROM public.academic_sessions
ORDER BY name DESC;