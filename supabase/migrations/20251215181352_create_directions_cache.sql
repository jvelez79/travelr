-- Migration: Create directions_cache table
-- Purpose: Global cache for Google Directions API responses
-- Shared between all users to reduce API calls

-- ============================================
-- Table: directions_cache
-- Global cache - NO RLS (shared between users)
-- ============================================
CREATE TABLE directions_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  from_lat DECIMAL(8,5) NOT NULL,
  from_lng DECIMAL(8,5) NOT NULL,
  to_lat DECIMAL(8,5) NOT NULL,
  to_lng DECIMAL(8,5) NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('driving', 'walking', 'transit')),
  travel_info JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_directions_cache_key ON directions_cache(cache_key);
CREATE INDEX idx_directions_cache_expires ON directions_cache(expires_at);

-- Comments for documentation
COMMENT ON TABLE directions_cache IS 'Global cache for Google Directions API responses - shared between all users';
COMMENT ON COLUMN directions_cache.cache_key IS 'Hash of normalized coordinates + mode for quick lookup';
COMMENT ON COLUMN directions_cache.travel_info IS 'JSONB containing {distance, duration, method}';
COMMENT ON COLUMN directions_cache.expires_at IS '30 day TTL from creation';

-- Grant access to authenticated users (no RLS - public cache)
-- Note: We don't enable RLS because this is intentionally a shared cache
ALTER TABLE directions_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read and insert
CREATE POLICY "Anyone can read directions cache"
  ON directions_cache
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can insert directions cache"
  ON directions_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update directions cache"
  ON directions_cache
  FOR UPDATE
  TO authenticated
  USING (true);
