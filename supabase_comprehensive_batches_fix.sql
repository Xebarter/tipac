-- Fix for batches table RLS policies

-- First, disable RLS temporarily
ALTER TABLE batches DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on batches table
DROP POLICY IF EXISTS "Allow authenticated users to manage batches" ON batches;
DROP POLICY IF EXISTS "Allow anon users to manage batches" ON batches;
DROP POLICY IF EXISTS "Allow admin users to manage batches" ON batches;
DROP POLICY IF EXISTS "Allow authenticated users to manage batches" ON batches;

-- Re-enable RLS
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy that allows all operations
CREATE POLICY "Allow all operations on batches"
ON batches
FOR ALL 
USING (true)
WITH CHECK (true);

-- Grant all permissions to both authenticated and anon users
GRANT ALL ON TABLE batches TO authenticated;
GRANT ALL ON TABLE batches TO anon;