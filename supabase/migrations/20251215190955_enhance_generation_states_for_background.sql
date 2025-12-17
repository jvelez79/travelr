-- Migration: Enhance generation_states for background processing
-- Purpose: Add columns for server-side background generation and enable Realtime

-- ============================================
-- New columns for background processing
-- ============================================

-- Error message for tracking failures
ALTER TABLE generation_states
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Retry count for automatic retries
ALTER TABLE generation_states
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Full places data (moved from localStorage to DB)
-- This allows Edge Function to access places without client
ALTER TABLE generation_states
ADD COLUMN IF NOT EXISTS full_places JSONB;

-- ============================================
-- Enable Realtime for generation_states
-- This allows clients to subscribe to changes
-- ============================================

-- First check if table is already in the publication
DO $$
BEGIN
  -- Add table to realtime publication if not already added
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'generation_states'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE generation_states;
  END IF;
END
$$;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON COLUMN generation_states.error_message IS 'Last error message from generation failure';
COMMENT ON COLUMN generation_states.retry_count IS 'Number of retry attempts for current day';
COMMENT ON COLUMN generation_states.full_places IS 'Full Google Places data for enrichment (moved from localStorage)';
