-- Create ticket_types table for managing different ticket types for events
CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Create index on event_id for better performance
CREATE INDEX IF NOT EXISTS ticket_types_event_id_idx ON ticket_types (event_id);