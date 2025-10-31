-- Helper queries for managing batches

-- View all existing batches
SELECT * FROM batches ORDER BY created_at DESC;

-- Count batches by batch_code (to identify duplicates)
SELECT batch_code, COUNT(*) 
FROM batches 
GROUP BY batch_code 
HAVING COUNT(*) > 1;

-- Delete all batches (USE WITH CAUTION - ONLY FOR TESTING)
-- DELETE FROM batches;

-- Delete specific batch by batch_code
-- DELETE FROM batches WHERE batch_code = 'YOUR_BATCH_CODE_HERE';

-- Disable unique constraint (if needed for some reason)
-- ALTER TABLE batches DROP CONSTRAINT batches_batch_code_key;

-- Re-add unique constraint
-- ALTER TABLE batches ADD CONSTRAINT batches_batch_code_key UNIQUE (batch_code);