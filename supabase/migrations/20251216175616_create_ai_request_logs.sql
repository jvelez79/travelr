-- Create ai_request_logs table for tracking AI API usage and costs
-- This table stores all AI requests for monitoring and cost tracking

CREATE TABLE ai_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Request identification
  request_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,

  -- Provider info
  provider TEXT NOT NULL,
  model TEXT,

  -- Request context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,

  -- Token usage
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,

  -- Cost in cents (for precision, 1 cent = $0.01)
  cost_cents INTEGER DEFAULT 0,

  -- Timing
  duration_ms INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_message TEXT,

  -- Additional metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_ai_logs_created_at ON ai_request_logs(created_at DESC);
CREATE INDEX idx_ai_logs_user_id ON ai_request_logs(user_id);
CREATE INDEX idx_ai_logs_trip_id ON ai_request_logs(trip_id);
CREATE INDEX idx_ai_logs_status ON ai_request_logs(status);
CREATE INDEX idx_ai_logs_provider ON ai_request_logs(provider);
CREATE INDEX idx_ai_logs_endpoint ON ai_request_logs(endpoint);

-- Composite index for dashboard queries
CREATE INDEX idx_ai_logs_dashboard ON ai_request_logs(created_at DESC, provider, status);

-- Enable RLS
ALTER TABLE ai_request_logs ENABLE ROW LEVEL SECURITY;

-- Only service_role can access this table (admin check done at API level)
CREATE POLICY "Service role full access" ON ai_request_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE ai_request_logs IS 'Logs all AI API requests for monitoring and cost tracking';
COMMENT ON COLUMN ai_request_logs.cost_cents IS 'Estimated cost in USD cents (100 cents = $1.00)';
COMMENT ON COLUMN ai_request_logs.provider IS 'AI provider: claude-cli, anthropic, or openai';
COMMENT ON COLUMN ai_request_logs.status IS 'Request status: success or error';
