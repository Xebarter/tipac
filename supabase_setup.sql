-- Create gallery_images table
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  url TEXT,
  filename TEXT,
  original_name TEXT
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT,
  description TEXT,
  date DATE,
  time TIME,
  location TEXT,
  image_url TEXT,
  is_published BOOLEAN DEFAULT true
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_id UUID REFERENCES events(id),
  email TEXT,
  quantity INTEGER DEFAULT 1,
  status TEXT DEFAULT 'confirmed',
  pesapal_transaction_id TEXT,
  pesapal_status TEXT
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT,
  email TEXT,
  subject TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false
);

-- Insert sample data for testing
INSERT INTO events (title, description, date, time, location, is_published) VALUES
  ('Musical Theatre Performance', 'A wonderful musical theatre performance by talented children', '2025-11-15', '19:00:00', 'Uganda National Theatre', true),
  ('Cultural Storytelling Festival', 'An event celebrating Ugandan cultural stories', '2025-12-01', '15:00:00', 'Makerere University', true),
  ('Theatre Workshop', 'Hands-on workshop for young aspiring actors', '2025-11-30', '10:00:00', 'TIPAC Center', false);

-- Create storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Disable RLS for all tables
ALTER TABLE gallery_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages DISABLE ROW LEVEL SECURITY;