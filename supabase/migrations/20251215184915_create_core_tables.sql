-- Migration: Create core tables for Travelr
-- Tables: trips, plans, generation_states

-- ============================================
-- Function for auto-updating updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Table: trips
-- Main table for travel itineraries
-- ============================================
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  destination TEXT NOT NULL,
  origin TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  travelers INTEGER DEFAULT 1,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'draft', 'completed')),
  mode TEXT DEFAULT 'guided' CHECK (mode IN ('guided', 'manual')),
  current_phase INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at on trips
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Table: plans
-- Stores the full travel plan data as JSONB
-- ============================================
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id)
);

-- Trigger for updated_at on plans
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Table: generation_states
-- Tracks AI generation progress for each trip
-- ============================================
CREATE TABLE generation_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'idle',
  current_day INTEGER,
  completed_days INTEGER[] DEFAULT '{}',
  pending_days INTEGER[] DEFAULT '{}',
  failed_days JSONB DEFAULT '[]',
  summary_result JSONB,
  places_context JSONB,
  preferences JSONB,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id)
);

-- Trigger for updated_at on generation_states
CREATE TRIGGER update_generation_states_updated_at
  BEFORE UPDATE ON generation_states
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_plans_trip_id ON plans(trip_id);
CREATE INDEX idx_plans_user_id ON plans(user_id);
CREATE INDEX idx_generation_states_trip_id ON generation_states(trip_id);
CREATE INDEX idx_generation_states_user_id ON generation_states(user_id);
CREATE INDEX idx_generation_states_status ON generation_states(status);

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE trips IS 'Main table storing travel itinerary metadata';
COMMENT ON TABLE plans IS 'Stores the full travel plan data as JSONB, one per trip';
COMMENT ON TABLE generation_states IS 'Tracks AI generation progress and state for each trip';

COMMENT ON COLUMN trips.status IS 'planning: actively editing, draft: saved but not finalized, completed: trip finished';
COMMENT ON COLUMN trips.mode IS 'guided: AI-assisted planning, manual: user controls everything';
COMMENT ON COLUMN trips.current_phase IS 'Current step in the planning wizard (0-based)';
COMMENT ON COLUMN generation_states.status IS 'idle, generating, paused, completed, error';
COMMENT ON COLUMN generation_states.failed_days IS 'Array of {day: number, error: string, attempts: number}';
