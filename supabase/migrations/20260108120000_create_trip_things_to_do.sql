-- Migration: Create trip_things_to_do table
-- Purpose: Store "Things To Do" wishlist items per trip

-- ============================================
-- Table: trip_things_to_do
-- Stores places that users want to consider for their trip
-- before adding them to the actual itinerary
-- ============================================
CREATE TABLE trip_things_to_do (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  google_place_id TEXT NOT NULL,
  place_data JSONB NOT NULL,  -- Cached Google Places data (name, photos, rating, etc.)
  category TEXT,  -- attractions, food_drink, tours, activities
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate places in the same trip
  UNIQUE(trip_id, google_place_id)
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_trip_things_to_do_trip_id ON trip_things_to_do(trip_id);
CREATE INDEX idx_trip_things_to_do_category ON trip_things_to_do(category);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE trip_things_to_do ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access things_to_do for their own trips
CREATE POLICY "Users can view their trips things_to_do"
  ON trip_things_to_do FOR SELECT
  USING (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert to their trips things_to_do"
  ON trip_things_to_do FOR INSERT
  WITH CHECK (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete from their trips things_to_do"
  ON trip_things_to_do FOR DELETE
  USING (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE trip_things_to_do IS 'Wishlist of places to consider for a trip before adding to itinerary';
COMMENT ON COLUMN trip_things_to_do.place_data IS 'Cached Google Places data: {name, photos, rating, user_ratings_total, formatted_address, types, etc.}';
COMMENT ON COLUMN trip_things_to_do.category IS 'UI category: attractions, food_drink, tours, activities';
