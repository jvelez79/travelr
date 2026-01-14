/**
 * Types for AI Prompts management
 */

export interface AIPrompt {
  id: string
  key: string
  name: string
  description: string | null
  system_prompt: string
  user_prompt: string
  is_active: boolean
  version: number
  created_at: string
  updated_at: string
  updated_by: string | null
}

export interface AIPromptUpdate {
  name?: string
  description?: string
  system_prompt?: string
  user_prompt?: string
  is_active?: boolean
}

export interface AIPromptListResponse {
  prompts: AIPrompt[]
}

export interface AIPromptResponse {
  prompt: AIPrompt
}

export interface AIPromptError {
  error: string
}
