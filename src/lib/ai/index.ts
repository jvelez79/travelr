import type { AIProvider, AIProviderType } from './types'
import { ClaudeCLIProvider } from './providers/claude-cli'
import { AnthropicProvider } from './providers/anthropic'
import { OpenAIProvider } from './providers/openai'

export * from './types'

let cachedProvider: AIProvider | null = null

/**
 * Get the configured AI provider based on environment variable
 */
export function getAIProvider(): AIProvider {
  if (cachedProvider) {
    return cachedProvider
  }

  const providerType = (process.env.AI_PROVIDER || 'claude-cli') as AIProviderType

  switch (providerType) {
    case 'claude-cli':
      cachedProvider = new ClaudeCLIProvider()
      break
    case 'anthropic':
      cachedProvider = new AnthropicProvider()
      break
    case 'openai':
      cachedProvider = new OpenAIProvider()
      break
    default:
      throw new Error(`Unknown AI provider: ${providerType}`)
  }

  return cachedProvider
}

/**
 * Clear the cached provider (useful for testing or config changes)
 */
function clearProviderCache(): void {
  cachedProvider = null
}
