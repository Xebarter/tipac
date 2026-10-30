-- Add payment method tracking for online ticket purchases
-- (mobile_money via Paytota STK; card via Pesapal — names are internal only)

ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS payment_method TEXT;

ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS payment_reference TEXT;

COMMENT ON COLUMN tickets.payment_method IS 'online payment rail: mobile_money | card | null (free)';
COMMENT ON COLUMN tickets.payment_reference IS 'Provider purchase/order id (mobile money purchase id or card order id)';

CREATE INDEX IF NOT EXISTS tickets_payment_reference_idx ON tickets (payment_reference);
CREATE INDEX IF NOT EXISTS tickets_payment_method_idx ON tickets (payment_method);
