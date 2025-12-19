// AI Provider Types

export type AIProviderType = 'claude-cli' | 'anthropic' | 'openai'

interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AICompletionOptions {
  messages: AIMessage[]
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number
}

export interface AICompletionResponse {
  content: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

export interface AIProvider {
  name: AIProviderType
  complete(options: AICompletionOptions): Promise<AICompletionResponse>
  stream?(options: AICompletionOptions): AsyncIterable<AIStreamChunk>
  supportsStreaming?: boolean
}

// Streaming types
export interface AIStreamChunk {
  type: 'text' | 'done' | 'error'
  content?: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
  error?: string
}

// Phase-specific AI request types
type PhaseContext =
  | 'investigation'
  | 'budget'
  | 'documentation'
  | 'flights'
  | 'lodging'
  | 'transport'
  | 'itinerary'
  | 'packing'

interface TripContext {
  destination: string
  origin: string
  startDate?: string
  endDate?: string
  travelers: number
  phaseData?: Record<string, unknown>
}
