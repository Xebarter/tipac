-- Create invitation_cards table
CREATE TABLE IF NOT EXISTS invitation_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_id UUID REFERENCES events(id),
  batch_code TEXT,
  card_type TEXT DEFAULT 'Regular',
  qr_code TEXT,
  is_used BOOLEAN DEFAULT false
);

-- Create invitation_card_batches table for tracking invitation card batches
CREATE TABLE IF NOT EXISTS invitation_card_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  batch_code TEXT UNIQUE,
  event_id UUID REFERENCES events(id),
  num_cards INTEGER,
  card_type TEXT DEFAULT 'Regular'
);

-- Enable RLS on invitation_cards and invitation_card_batches tables
ALTER TABLE invitation_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_card_batches ENABLE ROW LEVEL SECURITY;

-- Create policies for invitation_cards - Allow all operations to authenticated users
-- This matches the pattern used for other tables in the schema
CREATE POLICY "Allow authenticated users to manage invitation cards"
ON invitation_cards
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policies for invitation_card_batches - Allow all operations to authenticated users
-- This matches the pattern used for other tables in the schema
CREATE POLICY "Allow authenticated users to manage invitation card batches"
ON invitation_card_batches
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Also allow anon users to match other tables pattern
CREATE POLICY "Allow anon users to manage invitation cards"
ON invitation_cards
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Also allow anon users to match other tables pattern
CREATE POLICY "Allow anon users to manage invitation card batches"
ON invitation_card_batches
FOR ALL
TO anon
USING (true)
WITH CHECK (true);