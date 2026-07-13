-- Remove tuition fees from all programs
-- Tuition fees will be set individually per student after admission

UPDATE programs 
SET tuition_fee = NULL 
WHERE tuition_fee IS NOT NULL;

-- Verify the update
SELECT id, title, tuition_fee 
FROM programs 
ORDER BY title;
