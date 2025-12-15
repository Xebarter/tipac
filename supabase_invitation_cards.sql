-- Create invitation_cards table
CREATE TABLE IF NOT EXISTS invitation_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  batch_code TEXT NOT NULL,
  card_type TEXT DEFAULT 'Regular',
  qr_code TEXT,
  is_used BOOLEAN DEFAULT FALSE
);

-- Create invitation_card_batches table
CREATE TABLE IF NOT EXISTS invitation_card_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  batch_code TEXT UNIQUE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  num_cards INTEGER NOT NULL,
  card_type TEXT DEFAULT 'Regular'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitation_cards_batch_code ON invitation_cards(batch_code);
CREATE INDEX IF NOT EXISTS idx_invitation_cards_event_id ON invitation_cards(event_id);
CREATE INDEX IF NOT EXISTS idx_invitation_card_batches_batch_code ON invitation_card_batches(batch_code);
CREATE INDEX IF NOT EXISTS idx_invitation_card_batches_event_id ON invitation_card_batches(event_id);

-- Enable RLS (Row Level Security)
ALTER TABLE invitation_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_card_batches ENABLE ROW LEVEL SECURITY;

-- Create policies for invitation_cards - allow access to authenticated users
CREATE POLICY "Allow authenticated users to view invitation cards" 
ON invitation_cards FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert invitation cards" 
ON invitation_cards FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update invitation cards" 
ON invitation_cards FOR UPDATE 
TO authenticated 
USING (true);

-- Create policies for invitation_card_batches - allow access to authenticated users
CREATE POLICY "Allow authenticated users to view invitation card batches" 
ON invitation_card_batches FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert invitation card batches" 
ON invitation_card_batches FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update invitation card batches" 
ON invitation_card_batches FOR UPDATE 
TO authenticated 
USING (true);

-- Grant permissions to authenticated users
GRANT ALL ON invitation_cards TO authenticated;
GRANT ALL ON invitation_card_batches TO authenticated;