-- Add organizer and sponsor fields to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS organizer_name TEXT,
ADD COLUMN IF NOT EXISTS organizer_logo_url TEXT,
ADD COLUMN IF NOT EXISTS sponsor_logos JSONB;

-- Add comments to describe the new columns
COMMENT ON COLUMN events.organizer_name IS 'Name of the event organizer';
COMMENT ON COLUMN events.organizer_logo_url IS 'URL to the organizer logo image';
COMMENT ON COLUMN events.sponsor_logos IS 'JSON array of sponsor logo URLs';