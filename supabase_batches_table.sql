-- Create batches table for tracking physical ticket batches
CREATE TABLE IF NOT EXISTS batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  batch_code TEXT UNIQUE,
  event_id UUID REFERENCES events(id),
  num_tickets INTEGER,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on batches table
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

-- Create policies for batches - Allow all operations to authenticated users
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