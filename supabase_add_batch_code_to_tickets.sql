-- Add batch_code column to tickets table if it doesn't exist
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS batch_code TEXT;

-- Also add other potentially missing columns for offline ticket support
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS purchase_channel TEXT DEFAULT 'online';

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

-- Create an index on batch_code for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_batch_code ON tickets(batch_code);

-- Update existing tickets to have proper default values
UPDATE tickets 
SET purchase_channel = 'online' 
WHERE purchase_channel IS NULL;

UPDATE tickets 
SET is_active = true 
WHERE is_active IS NULL;

UPDATE tickets 
SET used = false 
WHERE used IS NULL;