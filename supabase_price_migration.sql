-- Migration script to add price column to tickets table
-- This should be run on existing databases to add the price functionality

ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;

-- Add a comment to document the column
COMMENT ON COLUMN tickets.price IS 'Price of the ticket in Kenyan Shillings (KES)';