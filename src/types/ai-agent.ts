/**
 * AI Travel Agent Types
 *
 * Types for the conversational AI agent that orchestrates trip modifications
 * through natural language interactions.
 */

// ============================================
// Database Types
// ============================================

/**
 * Conversation thread between user and AI Travel Agent
 */
export interface Conversation {
  id: string
  trip_id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
}

/**
 * Individual message within a conversation
 */
export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tool_calls: ToolCall[] | null
  created_at: string
}

/**
 * Tool call executed by the AI
 */
export interface ToolCall {
  toolName: string
  toolInput: Record<string, unknown>
  result?: string
}

// ============================================
// Streaming Types
// ============================================

/**
 * Types of events sent during SSE streaming
 */
export type ChatStreamEventType = 'text' | 'tool_call' | 'tool_result' | 'places_context' | 'done' | 'error'

/**
 * Event sent through SSE stream
 */
export interface ChatStreamEvent {
  type: ChatStreamEventType
  content?: string
  toolName?: string
  toolInput?: Record<string, unknown>
  toolResult?: string
  error?: string
  // Places context (only present in 'places_context' events)
  placesContext?: Record<string, PlaceChipData>
  // Continuation fields (only present in 'done' events when limit was hit)
  canContinue?: boolean
  pendingToolCount?: number
}

// ============================================
// Tool Definition Types
// ============================================

/**
 * Tool available to the AI Travel Agent
 * Follows Anthropic Messages API tool schema
 */
export interface TravelAgentTool {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required: string[]
  }
}

/**
 * Context provided to tool execution functions
 */
export interface ToolExecutionContext {
  tripId: string
  userId: string
  plan: GeneratedPlan
  supabase: SupabaseClient
}

// ============================================
// API Request/Response Types
// ============================================

/**
 * Request to chat endpoint
 */
export interface ChatRequest {
  tripId: string
  conversationId?: string | null
  message: string
}

/**
 * Response from conversations list endpoint
 */
export interface ConversationsResponse {
  conversations: Conversation[]
}

/**
 * Response from delete conversation endpoint
 */
export interface DeleteConversationResponse {
  success: boolean
}

// ============================================
// Component/Hook Types
// ============================================

/**
 * Message displayed in chat UI
 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  toolCalls?: ToolCall[]
  isStreaming?: boolean
  requiresConfirmation?: boolean
  confirmationMessage?: string
  placesContext?: Record<string, PlaceChipData> // Map of place_id to place data for chips
}

/**
 * Continuation state when step limit is reached
 */
export interface ContinuationState {
  canContinue: boolean
  pendingToolCount: number
  partialProgress?: string
}

/**
 * Trip context for AI prompts
 */
export interface TripContext {
  destination: string
  origin: string
  startDate: string
  endDate: string
  travelers: number
  currentDayCount: number
}

// ============================================
// Google Places Integration Types
// ============================================

/**
 * Simplified place search result for AI agent
 */
export interface PlaceSearchResult {
  id: string
  name: string
  category: string
  rating?: number
  reviewCount?: number
  priceLevel?: 1 | 2 | 3 | 4
  imageUrl?: string
  address?: string
  description?: string
  location: { lat: number; lng: number }
}

/**
 * Place data for rendering interactive chips in chat messages
 * Lightweight version optimized for inline display
 */
export interface PlaceChipData {
  id: string                    // Google Place ID
  name: string                  // Nombre del lugar
  rating?: number               // 0-5
  reviewCount?: number          // Cantidad de reviews
  category?: string             // 'restaurant', 'attraction', etc.
  priceLevel?: 1 | 2 | 3 | 4   // $ a $$$$
  imageUrl?: string             // Primera imagen
  address?: string              // Dirección completa
  description?: string          // Descripción breve
  location: {                   // Coordenadas para Google Maps
    lat: number
    lng: number
  }
}

/**
 * Travel time calculation result
 */
export interface TravelTimeResult {
  duration: number // seconds
  distance: number // meters
  durationText: string
  distanceText: string
}

// ============================================
// Import dependencies
// ============================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type { GeneratedPlan } from './plan'
