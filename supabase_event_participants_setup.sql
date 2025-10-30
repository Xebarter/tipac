-- Create event_participants table
CREATE TABLE event_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT,
  email TEXT,
  organization_type TEXT CHECK (organization_type IN ('school', 'organization')),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE
);

-- Disable RLS on the new table
ALTER TABLE event_participants DISABLE ROW LEVEL SECURITY;

-- Add a comment to explain the purpose of this table
COMMENT ON TABLE event_participants IS 'Table to store participants (schools and organizations) registered for events';