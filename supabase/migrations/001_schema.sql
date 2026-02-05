-- Cupid's Arrow Database Schema
-- Version: 1.0.0
-- Description: Core tables for romantic experience delivery platform

-- ============================================
-- ENUMS
-- ============================================

-- Experience type: defines the mode of the romantic experience
CREATE TYPE experience_type AS ENUM ('CRUSH', 'COUPLE');

-- Lifecycle state: tracks the experience through its journey
CREATE TYPE lifecycle_state AS ENUM (
  'DRAFT',      -- Experience created but not previewed
  'PREVIEW',    -- Experience has been previewed
  'PAID',       -- Payment completed
  'SENT',       -- Email sent to recipient
  'OPENED',     -- Recipient opened the experience
  'RESPONDED'   -- Recipient responded to the CTA
);

-- Payment status: tracks payment lifecycle
CREATE TYPE payment_status AS ENUM (
  'PENDING',    -- Payment initiated but not completed
  'COMPLETED',  -- Payment successful
  'FAILED',     -- Payment failed
  'REFUNDED'    -- Payment refunded
);

-- ============================================
-- EXPERIENCES TABLE
-- ============================================
-- Core table storing all experience data

CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Experience configuration
  experience_type experience_type NOT NULL,
  lifecycle_state lifecycle_state NOT NULL DEFAULT 'DRAFT',
  
  -- Sender information (optional for crush mode)
  sender_name TEXT,
  
  -- Recipient information (required)
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  
  -- Experience content (JSONB for flexibility)
  -- For CRUSH: { admirationMessages: string[], customMessage: string }
  -- For COUPLE: { memories: { title, description, date }[], appreciationMessage: string }
  content JSONB NOT NULL DEFAULT '{}',
  
  -- Pricing (stored in paise for India)
  amount_paise INTEGER NOT NULL,
  
  -- Timestamps for lifecycle tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  
  -- Response data (for analytics)
  response TEXT, -- 'YES', 'NO', 'GRACEFUL_EXIT', or custom response
  
  -- Indexes
  CONSTRAINT valid_email CHECK (recipient_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index for quick lookup by lifecycle state
CREATE INDEX idx_experiences_lifecycle ON experiences(lifecycle_state);

-- Index for email lookups (for webhook processing)
CREATE INDEX idx_experiences_recipient_email ON experiences(recipient_email);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
-- Tracks Razorpay payment lifecycle

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to experience
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  
  -- Razorpay identifiers
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  
  -- Payment details
  amount_paise INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status payment_status NOT NULL DEFAULT 'PENDING',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  
  -- Error tracking
  error_code TEXT,
  error_description TEXT
);

-- Index for Razorpay order lookups
CREATE INDEX idx_payments_razorpay_order ON payments(razorpay_order_id);

-- Index for experience payment status
CREATE INDEX idx_payments_experience ON payments(experience_id);

-- ============================================
-- ANALYTICS EVENTS TABLE
-- ============================================
-- Tracks user interactions for insights

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to experience (optional for landing page events)
  experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL,
  
  -- Flexible metadata storage
  -- Examples: { buttonClicked: 'yes', attemptNumber: 3 }
  metadata JSONB DEFAULT '{}',
  
  -- Client information
  user_agent TEXT,
  ip_address INET,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for experience analytics lookup
CREATE INDEX idx_analytics_experience ON analytics_events(experience_id);

-- Index for event type filtering
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);

-- ============================================
-- UPDATE TIMESTAMP TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_experiences_updated_at
  BEFORE UPDATE ON experiences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Experiences: Public can only read by ID (for playback page)
-- Service role (Edge Functions) has full access
CREATE POLICY "Public can view experiences by ID" ON experiences
  FOR SELECT
  USING (true);

-- No public insert/update/delete - only via Edge Functions with service role
CREATE POLICY "Service role full access to experiences" ON experiences
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Payments: Only service role access
CREATE POLICY "Service role full access to payments" ON payments
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Analytics: Only service role can insert, select for analytics
CREATE POLICY "Service role full access to analytics" ON analytics_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- HELPFUL VIEWS
-- ============================================

-- View for experience with payment status
CREATE VIEW experience_status AS
SELECT 
  e.id,
  e.experience_type,
  e.lifecycle_state,
  e.recipient_name,
  e.recipient_email,
  e.amount_paise,
  e.created_at,
  p.status as payment_status,
  p.razorpay_order_id,
  p.razorpay_payment_id
FROM experiences e
LEFT JOIN payments p ON e.id = p.experience_id;
