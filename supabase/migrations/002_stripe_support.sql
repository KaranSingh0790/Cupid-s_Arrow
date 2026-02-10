-- Cupid's Arrow - Stripe Payment Support
-- Version: 1.1.0
-- Description: Adds Stripe payment gateway support alongside existing Razorpay
-- NOTE: This migration is ADDITIVE ONLY - no existing columns or logic are modified

-- ============================================
-- ADD STRIPE COLUMNS TO PAYMENTS TABLE
-- ============================================

-- Payment gateway identifier (defaults to razorpay for backward compatibility)
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'razorpay';

-- Stripe-specific identifiers
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- ============================================
-- CREATE INDEXES FOR STRIPE LOOKUPS
-- ============================================

-- Index for Stripe Checkout Session lookups (webhook processing)
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session 
  ON payments(stripe_session_id) 
  WHERE stripe_session_id IS NOT NULL;

-- Index for Stripe Payment Intent lookups
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent 
  ON payments(stripe_payment_intent_id) 
  WHERE stripe_payment_intent_id IS NOT NULL;

-- ============================================
-- ADD CONSTRAINT FOR PAYMENT GATEWAY
-- ============================================

-- Ensure valid gateway values
ALTER TABLE payments
  ADD CONSTRAINT IF NOT EXISTS valid_payment_gateway 
  CHECK (payment_gateway IN ('razorpay', 'stripe'));

-- ============================================
-- UPDATE VIEW TO INCLUDE STRIPE DATA
-- ============================================

-- Drop and recreate the view to include Stripe fields
DROP VIEW IF EXISTS experience_status;

CREATE VIEW experience_status AS
SELECT 
  e.id,
  e.experience_type,
  e.lifecycle_state,
  e.recipient_name,
  e.recipient_email,
  e.amount_paise,
  e.created_at,
  p.payment_gateway,
  p.status as payment_status,
  -- Razorpay fields
  p.razorpay_order_id,
  p.razorpay_payment_id,
  -- Stripe fields
  p.stripe_session_id,
  p.stripe_payment_intent_id
FROM experiences e
LEFT JOIN payments p ON e.id = p.experience_id;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN payments.payment_gateway IS 'Payment processor used: razorpay or stripe';
COMMENT ON COLUMN payments.stripe_session_id IS 'Stripe Checkout Session ID';
COMMENT ON COLUMN payments.stripe_payment_intent_id IS 'Stripe Payment Intent ID (received after successful payment)';
COMMENT ON COLUMN payments.stripe_customer_id IS 'Stripe Customer ID (optional, for future use)';
