-- Migration script to add ticket_type_id column to tickets table
-- This script should be run on the Supabase database

-- Add ticket_type_id column to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS ticket_type_id UUID REFERENCES ticket_types(id);

-- Add an index on ticket_type_id for better performance
CREATE INDEX IF NOT EXISTS tickets_ticket_type_id_idx ON tickets (ticket_type_id);