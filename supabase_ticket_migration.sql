-- Migration script to add new fields for offline ticket support
-- This script should be run on the Supabase database

-- Add ticket_type_id column to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS ticket_type_id UUID REFERENCES ticket_types(id);

-- Add new columns to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS purchase_channel TEXT DEFAULT 'online'; -- 'online' or 'physical_batch'

ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS batch_code TEXT;

ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS qr_code TEXT;

ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS buyer_name TEXT;

ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS buyer_phone TEXT;

ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS used BOOLEAN DEFAULT false;

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