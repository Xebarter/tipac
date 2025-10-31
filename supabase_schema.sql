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
  pesapal_status TEXT,
  price INTEGER DEFAULT 0,
  -- New fields for offline ticket support
  purchase_channel TEXT DEFAULT 'online', -- 'online' or 'physical_batch'
  batch_code TEXT,
  is_active BOOLEAN DEFAULT true,
  qr_code TEXT,
  buyer_name TEXT,
  buyer_phone TEXT,
  used BOOLEAN DEFAULT false
);

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
CREATE POLICY "Allow authenticated users to manage batches"
ON batches
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

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

-- Create storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for gallery_images - Allow all operations to authenticated users
CREATE POLICY "Allow authenticated users to manage gallery images"
ON gallery_images
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policies for events - Allow all operations to authenticated users
CREATE POLICY "Allow authenticated users to manage events"
ON events
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policies for tickets - Allow all operations to authenticated users
CREATE POLICY "Allow authenticated users to manage tickets"
ON tickets
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policies for contact_messages - Allow all operations to authenticated users
CREATE POLICY "Allow authenticated users to manage contact messages"
ON contact_messages
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Storage policies for gallery bucket
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to gallery"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gallery');

-- Allow public read access to gallery images
CREATE POLICY "Public read access to gallery images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'gallery');

-- Allow authenticated users to delete from gallery
CREATE POLICY "Allow authenticated deletions from gallery"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'gallery');

-- Insert sample data for testing
INSERT INTO events (title, description, date, time, location, is_published) VALUES
  ('Musical Theatre Performance', 'A wonderful musical theatre performance by talented children', '2025-11-15', '19:00:00', 'Uganda National Theatre', true),
  ('Cultural Storytelling Festival', 'An event celebrating Ugandan cultural stories', '2025-12-01', '15:00:00', 'Makerere University', true),
  ('Theatre Workshop', 'Hands-on workshop for young aspiring actors', '2025-11-30', '10:00:00', 'TIPAC Center', false);