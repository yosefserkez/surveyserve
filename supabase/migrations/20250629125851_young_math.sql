/*
  # Payment-Gated Survey System

  1. Schema Changes
    - Add price field to surveys table
    - Create payments table for transaction tracking
    - Add payment-related fields to survey_links table
    - Create payment sessions table for temporary payment tracking

  2. Security
    - RLS policies for payment data
    - Audit trail for all payment operations
    - Secure access controls

  3. Indexes
    - Performance optimization for payment queries
    - Efficient lookup by payment status and session
*/

-- Add price field to surveys table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'surveys' AND column_name = 'price'
  ) THEN
    ALTER TABLE surveys ADD COLUMN price decimal(10,2) DEFAULT 0.00;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'surveys' AND column_name = 'currency'
  ) THEN
    ALTER TABLE surveys ADD COLUMN currency text DEFAULT 'USD';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'surveys' AND column_name = 'stripe_product_id'
  ) THEN
    ALTER TABLE surveys ADD COLUMN stripe_product_id text;
  END IF;
END $$;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  researcher_id uuid NOT NULL REFERENCES researchers(id) ON DELETE CASCADE,
  stripe_payment_intent_id text UNIQUE NOT NULL,
  stripe_checkout_session_id text UNIQUE,
  amount decimal(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
  payment_method_types text[] DEFAULT ARRAY['card'],
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  failed_at timestamptz,
  failure_reason text
);

-- Create payment sessions table for temporary tracking
CREATE TABLE IF NOT EXISTS payment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  researcher_id uuid NOT NULL REFERENCES researchers(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  stripe_checkout_session_id text UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'canceled')),
  survey_link_id uuid REFERENCES survey_links(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Add payment-related fields to survey_links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'survey_links' AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE survey_links ADD COLUMN payment_id uuid REFERENCES payments(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'survey_links' AND column_name = 'is_paid'
  ) THEN
    ALTER TABLE survey_links ADD COLUMN is_paid boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'survey_links' AND column_name = 'access_token'
  ) THEN
    ALTER TABLE survey_links ADD COLUMN access_token text UNIQUE;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_researcher_id ON payments(researcher_id);
CREATE INDEX IF NOT EXISTS idx_payments_survey_id ON payments(survey_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON payments(stripe_checkout_session_id);

CREATE INDEX IF NOT EXISTS idx_payment_sessions_researcher_id ON payment_sessions(researcher_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_survey_id ON payment_sessions(survey_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_token ON payment_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_expires ON payment_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_status ON payment_sessions(status);

CREATE INDEX IF NOT EXISTS idx_survey_links_payment_id ON survey_links(payment_id);
CREATE INDEX IF NOT EXISTS idx_survey_links_is_paid ON survey_links(is_paid);
CREATE INDEX IF NOT EXISTS idx_survey_links_access_token ON survey_links(access_token);

-- Enable RLS on new tables
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments table
CREATE POLICY "Researchers can view their own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (researcher_id = auth.uid());

CREATE POLICY "System can insert payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (researcher_id = auth.uid());

CREATE POLICY "System can update payment status"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (researcher_id = auth.uid())
  WITH CHECK (researcher_id = auth.uid());

-- RLS Policies for payment_sessions table
CREATE POLICY "Researchers can view their own payment sessions"
  ON payment_sessions
  FOR SELECT
  TO authenticated
  USING (researcher_id = auth.uid());

CREATE POLICY "Researchers can create payment sessions"
  ON payment_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (researcher_id = auth.uid());

CREATE POLICY "Researchers can update their payment sessions"
  ON payment_sessions
  FOR UPDATE
  TO authenticated
  USING (researcher_id = auth.uid())
  WITH CHECK (researcher_id = auth.uid());

-- Function to update payment timestamp
CREATE OR REPLACE FUNCTION update_payment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Set completion timestamp when status changes to succeeded
  IF NEW.status = 'succeeded' AND OLD.status != 'succeeded' THEN
    NEW.completed_at = now();
  END IF;
  
  -- Set failure timestamp when status changes to failed
  IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    NEW.failed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for payment timestamp updates
DROP TRIGGER IF EXISTS trigger_update_payment_timestamp ON payments;
CREATE TRIGGER trigger_update_payment_timestamp
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_timestamp();

-- Function to clean up expired payment sessions
CREATE OR REPLACE FUNCTION cleanup_expired_payment_sessions()
RETURNS void AS $$
BEGIN
  UPDATE payment_sessions 
  SET status = 'expired'
  WHERE expires_at < now() AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- Function to get payment summary for researcher
CREATE OR REPLACE FUNCTION get_payment_summary(researcher_uuid uuid)
RETURNS TABLE (
  total_payments bigint,
  total_amount decimal,
  successful_payments bigint,
  failed_payments bigint,
  pending_payments bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_payments,
    COALESCE(SUM(amount), 0) as total_amount,
    COUNT(*) FILTER (WHERE status = 'succeeded')::bigint as successful_payments,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint as failed_payments,
    COUNT(*) FILTER (WHERE status = 'pending')::bigint as pending_payments
  FROM payments
  WHERE researcher_id = researcher_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set default price for existing surveys (free)
UPDATE surveys SET price = 0.00, currency = 'USD' WHERE price IS NULL;