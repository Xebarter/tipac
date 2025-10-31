-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to manage batches" ON batches;

-- Create policies for batches - Allow all operations to authenticated and anon users
-- This matches the pattern used for other tables in the schema
CREATE POLICY "Allow authenticated users to manage batches"
ON batches
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Also allow anon users to match other tables pattern
CREATE POLICY "Allow anon users to manage batches"
ON batches
FOR ALL
TO anon
USING (true)
WITH CHECK (true);