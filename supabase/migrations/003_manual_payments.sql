-- Cupid's Arrow — Manual Payment Confirmations
-- Version: 1.3.0
-- Stores UPI / PayPal manual payment proofs
-- Semi-automated: admin gets email notification with one-click approve link

-- ============================================
-- MANUAL PAYMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS manual_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to experience
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,

  -- Payer details
  name TEXT NOT NULL,
  email TEXT NOT NULL,

  -- Payment info
  payment_method TEXT NOT NULL CHECK (payment_method IN ('upi', 'paypal')),
  transaction_id TEXT NOT NULL,
  screenshot_url TEXT,

  -- Message content summary (for quick review)
  message_content TEXT,

  -- Order reference shown in UPI transaction note (for cross-referencing)
  order_ref TEXT,

  -- One-time approval token (UUID) — used in admin approve link
  approval_token UUID NOT NULL DEFAULT gen_random_uuid(),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Review status
  reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_manual_payments_experience ON manual_payments(experience_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_reviewed ON manual_payments(reviewed);
CREATE INDEX IF NOT EXISTS idx_manual_payments_created ON manual_payments(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_manual_payments_approval_token ON manual_payments(approval_token);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE manual_payments ENABLE ROW LEVEL SECURITY;

-- Only service role (Edge Functions) can read/write
CREATE POLICY "Service role full access to manual_payments" ON manual_payments
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow anon insert via edge function (the function uses service role anyway)
CREATE POLICY "Anon can insert manual_payments" ON manual_payments
  FOR INSERT
  WITH CHECK (true);
