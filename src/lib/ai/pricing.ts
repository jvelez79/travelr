/**
 * AI Pricing Configuration
 *
 * Pricing per 1M tokens for different AI providers and models.
 * Used to calculate estimated costs for AI requests.
 */

interface TokenPricing {
  inputPer1M: number // USD per 1M input tokens
  outputPer1M: number // USD per 1M output tokens
}

// Pricing in USD per 1M tokens (as of late 2024/early 2025)
const AI_PRICING: Record<string, TokenPricing> = {
  // Anthropic Claude models
  'claude-sonnet-4-20250514': { inputPer1M: 3.0, outputPer1M: 15.0 },
  'claude-3-5-sonnet-20241022': { inputPer1M: 3.0, outputPer1M: 15.0 },
  'claude-3-opus-20240229': { inputPer1M: 15.0, outputPer1M: 75.0 },
  'claude-3-haiku-20240307': { inputPer1M: 0.25, outputPer1M: 1.25 },

  // OpenAI models
  'gpt-4o': { inputPer1M: 2.5, outputPer1M: 10.0 },
  'gpt-4o-mini': { inputPer1M: 0.15, outputPer1M: 0.6 },
  'gpt-4-turbo': { inputPer1M: 10.0, outputPer1M: 30.0 },

  // Claude CLI (development) - no cost
  'claude-cli': { inputPer1M: 0, outputPer1M: 0 },

  // Default fallback (use Claude Sonnet pricing)
  default: { inputPer1M: 3.0, outputPer1M: 15.0 },
}

/**
 * Calculate cost in cents for a given model and token usage
 *
 * @param model - Model name (e.g., 'claude-sonnet-4-20250514', 'gpt-4o')
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @returns Cost in cents (100 cents = $1.00)
 */
export function calculateCostCents(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = AI_PRICING[model] || AI_PRICING['default']

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M

  // Convert to cents and round to nearest cent
  return Math.round((inputCost + outputCost) * 100)
}

/**
 * Get the model name for a given provider
 * Uses environment variables or defaults
 */
export function getModelForProvider(provider: string): string {
  switch (provider) {
    case 'anthropic':
      return process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'
    case 'openai':
      return process.env.OPENAI_MODEL || 'gpt-4o'
    case 'claude-cli':
      return 'claude-cli'
    default:
      return 'default'
  }
}
