-- Add sponsors table
CREATE TABLE IF NOT EXISTS sponsors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Add event_sponsors junction table
CREATE TABLE IF NOT EXISTS event_sponsors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  sponsor_id UUID REFERENCES sponsors(id),
  sponsor_type TEXT DEFAULT 'regular', -- 'organizer', 'regular'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, sponsor_id)
);

-- Enable RLS
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_sponsors ENABLE ROW LEVEL SECURITY;

-- Create policies for sponsors
CREATE POLICY "Allow authenticated users to manage sponsors"
ON sponsors FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Create policies for event_sponsors
CREATE POLICY "Allow authenticated users to manage event sponsors"
ON event_sponsors FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Add organization details to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS organizer_logo_url TEXT,
ADD COLUMN IF NOT EXISTS organizer_name TEXT;

-- Sample data
INSERT INTO sponsors (name, logo_url, website_url, is_active) VALUES
('TIPAC', '/images/sponsors/tipac-logo.png', 'https://tipac.co.ug', true),
('Uganda National Theatre', '/images/sponsors/unt-logo.png', 'https://nationaltheatre.go.ug', true);

-- Sample event-sponsor relationships
INSERT INTO event_sponsors (event_id, sponsor_id, sponsor_type)
SELECT 
  e.id,
  s.id,
  'organizer'
FROM events e
CROSS JOIN sponsors s
WHERE e.title = 'Musical Theatre Performance' 
AND s.name = 'TIPAC'
ON CONFLICT DO NOTHING;