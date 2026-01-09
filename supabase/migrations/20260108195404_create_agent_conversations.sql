-- Migration: Create agent_conversations and agent_messages tables
-- Purpose: Store AI Travel Agent conversation history per trip

-- ============================================
-- Table: agent_conversations
-- Stores conversation threads between user and AI Travel Agent
-- ============================================
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,  -- Auto-generated from first message, e.g., "Add restaurant to day 2"
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- Table: agent_messages
-- Stores individual messages within conversations
-- ============================================
CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES agent_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tool_calls JSONB,  -- Array of {toolName, toolInput, result}
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- Indexes for performance
-- ============================================

-- Conversations
CREATE INDEX idx_agent_conversations_trip ON agent_conversations(trip_id, updated_at DESC);
CREATE INDEX idx_agent_conversations_user ON agent_conversations(user_id, updated_at DESC);

-- Messages
CREATE INDEX idx_agent_messages_conversation ON agent_messages(conversation_id, created_at ASC);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access conversations for their own trips
CREATE POLICY "Users can view their own conversations"
  ON agent_conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own conversations"
  ON agent_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own conversations"
  ON agent_conversations FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own conversations"
  ON agent_conversations FOR DELETE
  USING (user_id = auth.uid());

-- Policy: Users can only access messages for their own conversations
CREATE POLICY "Users can view messages from their conversations"
  ON agent_messages FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM agent_conversations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert messages to their conversations"
  ON agent_messages FOR INSERT
  WITH CHECK (conversation_id IN (
    SELECT id FROM agent_conversations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update messages in their conversations"
  ON agent_messages FOR UPDATE
  USING (conversation_id IN (
    SELECT id FROM agent_conversations WHERE user_id = auth.uid()
  ))
  WITH CHECK (conversation_id IN (
    SELECT id FROM agent_conversations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete messages from their conversations"
  ON agent_messages FOR DELETE
  USING (conversation_id IN (
    SELECT id FROM agent_conversations WHERE user_id = auth.uid()
  ));

-- ============================================
-- Trigger to update updated_at on conversations
-- ============================================
CREATE OR REPLACE FUNCTION update_agent_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE agent_conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON agent_messages
FOR EACH ROW
EXECUTE FUNCTION update_agent_conversation_timestamp();

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE agent_conversations IS 'Conversation threads between user and AI Travel Agent';
COMMENT ON COLUMN agent_conversations.title IS 'Auto-generated summary from first message';
COMMENT ON COLUMN agent_conversations.updated_at IS 'Updated when new message is added';

COMMENT ON TABLE agent_messages IS 'Individual messages within AI Travel Agent conversations';
COMMENT ON COLUMN agent_messages.role IS 'Message sender: user, assistant, or system';
COMMENT ON COLUMN agent_messages.tool_calls IS 'Array of tools executed by AI: [{toolName, toolInput, result}]';
