import { createClient } from '@/lib/supabase/server'
import type { AIPrompt } from '@/types/ai-prompts'

// Fallback prompts for when database is not available
import {
  CURATED_DISCOVERY_SYSTEM_PROMPT,
  CURATED_DISCOVERY_PROMPT,
} from './prompts-curated'

interface PromptFallback {
  system_prompt: string
  user_prompt: string
}

const FALLBACK_PROMPTS: Record<string, PromptFallback> = {
  'curated-discovery': {
    system_prompt: CURATED_DISCOVERY_SYSTEM_PROMPT,
    user_prompt: CURATED_DISCOVERY_PROMPT,
  },
}

/**
 * Fetches an AI prompt from the database by key
 * Falls back to hardcoded prompt if not found or on error
 */
export async function getPromptByKey(key: string): Promise<{
  systemPrompt: string
  userPrompt: string
  fromDb: boolean
}> {
  try {
    const supabase = await createClient()

    const { data: prompt, error } = await supabase
      .from('ai_prompts')
      .select('system_prompt, user_prompt')
      .eq('key', key)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.warn(`[prompt-service] Error fetching prompt '${key}':`, error.message)
    }

    if (prompt) {
      console.log(`[prompt-service] Using DB prompt for '${key}'`)
      return {
        systemPrompt: prompt.system_prompt,
        userPrompt: prompt.user_prompt,
        fromDb: true,
      }
    }

    // Fallback to hardcoded prompts
    const fallback = FALLBACK_PROMPTS[key]
    if (fallback) {
      console.log(`[prompt-service] Using fallback prompt for '${key}'`)
      return {
        systemPrompt: fallback.system_prompt,
        userPrompt: fallback.user_prompt,
        fromDb: false,
      }
    }

    throw new Error(`No prompt found for key: ${key}`)
  } catch (error) {
    console.error(`[prompt-service] Failed to get prompt '${key}':`, error)

    // Last resort fallback
    const fallback = FALLBACK_PROMPTS[key]
    if (fallback) {
      return {
        systemPrompt: fallback.system_prompt,
        userPrompt: fallback.user_prompt,
        fromDb: false,
      }
    }

    throw error
  }
}

/**
 * Fills template placeholders in a prompt
 */
export function fillPromptTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }
  return result
}
