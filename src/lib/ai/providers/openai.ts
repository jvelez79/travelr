import type { AIProvider, AICompletionOptions, AICompletionResponse } from '../types'

const DEFAULT_TIMEOUT = 30000 // 30 seconds
const DEFAULT_MODEL = 'gpt-4o'

/**
 * OpenAI API Provider
 * Uses the OpenAI API directly (requires OPENAI_API_KEY)
 * Alternative production provider
 */
export class OpenAIProvider implements AIProvider {
  name = 'openai' as const
  private apiKey: string

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for OpenAI provider')
    }
    this.apiKey = apiKey
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResponse> {
    const { messages, systemPrompt, maxTokens = 4096, temperature = 0.7, timeout = DEFAULT_TIMEOUT } = options

    const apiMessages = []

    if (systemPrompt) {
      apiMessages.push({ role: 'system', content: systemPrompt })
    }

    for (const msg of messages) {
      apiMessages.push({
        role: msg.role,
        content: msg.content,
      })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
          max_tokens: maxTokens,
          temperature,
          messages: apiMessages,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`OpenAI API error: ${error}`)
      }

      const data = await response.json()

      return {
        content: data.choices[0].message.content,
        usage: {
          inputTokens: data.usage.prompt_tokens,
          outputTokens: data.usage.completion_tokens,
        },
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`OpenAI API timed out after ${timeout}ms`)
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }
}
