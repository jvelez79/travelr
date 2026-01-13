-- Migration: Add places_context column to agent_messages
-- Purpose: Store PlaceChipData map for rendering interactive place chips in AI chat messages
-- Feature: Place Chips Interactivos en AI Chat

-- ============================================
-- Add places_context column
-- ============================================
ALTER TABLE agent_messages
ADD COLUMN places_context JSONB;

-- ============================================
-- Index for efficient JSONB queries
-- ============================================
CREATE INDEX idx_agent_messages_places_context
ON agent_messages USING GIN (places_context);

-- ============================================
-- Comment for documentation
-- ============================================
COMMENT ON COLUMN agent_messages.places_context IS
'Map of place_id to PlaceChipData for rendering interactive chips in message content. Example: {"ChIJ...": {"id": "ChIJ...", "name": "Hotel Ritz", "rating": 4.7, ...}}';
