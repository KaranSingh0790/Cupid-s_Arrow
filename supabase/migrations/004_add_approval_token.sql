-- Add approval_token and order_ref to existing manual_payments table
-- Run this if 003 was already applied (table exists but missing new columns)

-- Order reference shown in UPI transaction note
ALTER TABLE manual_payments ADD COLUMN IF NOT EXISTS order_ref TEXT;

-- One-time approval token for admin one-click approve link
ALTER TABLE manual_payments ADD COLUMN IF NOT EXISTS approval_token UUID DEFAULT gen_random_uuid();

-- Make approval_token NOT NULL and unique
-- First backfill any existing rows
UPDATE manual_payments SET approval_token = gen_random_uuid() WHERE approval_token IS NULL;
ALTER TABLE manual_payments ALTER COLUMN approval_token SET NOT NULL;

-- Unique index on approval_token for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_manual_payments_approval_token ON manual_payments(approval_token);
