-- Migration: Add atomic JSONB update functions for plans
-- Purpose: Fix race condition when multiple Edge Function invocations update the plan concurrently

-- Function to update an entire day in the plan (atomic)
CREATE OR REPLACE FUNCTION update_day_in_plan(
  p_trip_id UUID,
  p_day_index INT,
  p_day_data JSONB
) RETURNS VOID AS $$
BEGIN
  UPDATE plans
  SET data = jsonb_set(
    data,
    ARRAY['itinerary', p_day_index::text],
    p_day_data,
    true  -- create if missing
  ),
  updated_at = NOW()
  WHERE trip_id = p_trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to append a single activity to a day's timeline (for progressive rendering)
CREATE OR REPLACE FUNCTION append_activity_to_day(
  p_trip_id UUID,
  p_day_index INT,
  p_activity JSONB
) RETURNS VOID AS $$
BEGIN
  UPDATE plans
  SET data = jsonb_set(
    data,
    ARRAY['itinerary', p_day_index::text, 'timeline'],
    COALESCE(data->'itinerary'->p_day_index->'timeline', '[]'::jsonb) || p_activity,
    true
  ),
  updated_at = NOW()
  WHERE trip_id = p_trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update day metadata (title, meals, notes, transport) without touching timeline
CREATE OR REPLACE FUNCTION update_day_metadata(
  p_trip_id UUID,
  p_day_index INT,
  p_title TEXT DEFAULT NULL,
  p_meals JSONB DEFAULT NULL,
  p_transport TEXT DEFAULT NULL,
  p_overnight TEXT DEFAULT NULL,
  p_important_notes JSONB DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  current_day JSONB;
BEGIN
  -- Get current day data
  SELECT data->'itinerary'->p_day_index INTO current_day
  FROM plans WHERE trip_id = p_trip_id;

  -- Update only provided fields
  IF p_title IS NOT NULL THEN
    current_day = jsonb_set(current_day, '{title}', to_jsonb(p_title));
  END IF;

  IF p_meals IS NOT NULL THEN
    current_day = jsonb_set(current_day, '{meals}', p_meals);
  END IF;

  IF p_transport IS NOT NULL THEN
    current_day = jsonb_set(current_day, '{transport}', to_jsonb(p_transport));
  END IF;

  IF p_overnight IS NOT NULL THEN
    current_day = jsonb_set(current_day, '{overnight}', to_jsonb(p_overnight));
  END IF;

  IF p_important_notes IS NOT NULL THEN
    current_day = jsonb_set(current_day, '{importantNotes}', p_important_notes);
  END IF;

  -- Update the plan
  UPDATE plans
  SET data = jsonb_set(data, ARRAY['itinerary', p_day_index::text], current_day),
      updated_at = NOW()
  WHERE trip_id = p_trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users and service role
GRANT EXECUTE ON FUNCTION update_day_in_plan(UUID, INT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_day_in_plan(UUID, INT, JSONB) TO service_role;

GRANT EXECUTE ON FUNCTION append_activity_to_day(UUID, INT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION append_activity_to_day(UUID, INT, JSONB) TO service_role;

GRANT EXECUTE ON FUNCTION update_day_metadata(UUID, INT, TEXT, JSONB, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_day_metadata(UUID, INT, TEXT, JSONB, TEXT, TEXT, JSONB) TO service_role;

COMMENT ON FUNCTION update_day_in_plan IS 'Atomically update an entire day in the plan itinerary';
COMMENT ON FUNCTION append_activity_to_day IS 'Atomically append a single activity to a day timeline (for progressive rendering)';
COMMENT ON FUNCTION update_day_metadata IS 'Update day metadata (title, meals, transport) without touching timeline';
