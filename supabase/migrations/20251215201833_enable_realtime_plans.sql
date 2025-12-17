-- Migration: Enable Realtime for plans table
-- Purpose: Allow clients to subscribe to plan changes for real-time UI updates

-- Add plans table to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'plans'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE plans;
  END IF;
END
$$;

COMMENT ON TABLE plans IS 'Travel plans with real-time updates enabled for background generation';
