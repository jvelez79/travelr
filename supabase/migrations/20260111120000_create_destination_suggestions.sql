-- Migration: Create destination_suggestions cache table
-- Purpose: Global cache for AI-curated destination suggestions
-- Shared between all users to reduce AI API calls

-- ============================================
-- Table: destination_suggestions
-- Global cache - accessible by all users
-- ============================================
CREATE TABLE destination_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  place_name TEXT NOT NULL,
  suggestions JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_destination_suggestions_cache_key ON destination_suggestions(cache_key);
CREATE INDEX idx_destination_suggestions_expires ON destination_suggestions(expires_at);

-- Comments for documentation
COMMENT ON TABLE destination_suggestions IS 'Global cache for AI-curated destination suggestions - shared between all users';
COMMENT ON COLUMN destination_suggestions.cache_key IS 'Normalized destination string for lookup (e.g., "costa-rica")';
COMMENT ON COLUMN destination_suggestions.place_name IS 'Original destination name for reference';
COMMENT ON COLUMN destination_suggestions.suggestions IS 'JSONB containing {mustSeeAttractions, outstandingRestaurants, uniqueExperiences}';
COMMENT ON COLUMN destination_suggestions.generated_at IS 'When the suggestions were generated';
COMMENT ON COLUMN destination_suggestions.expires_at IS '30 day TTL from generation';

-- Enable RLS
ALTER TABLE destination_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Global cache accessible by authenticated users
CREATE POLICY "Anyone can read destination suggestions"
  ON destination_suggestions
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can insert destination suggestions"
  ON destination_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update destination suggestions"
  ON destination_suggestions
  FOR UPDATE
  TO authenticated
  USING (true);
