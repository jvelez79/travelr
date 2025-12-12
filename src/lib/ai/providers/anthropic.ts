import type { AIProvider, AICompletionOptions, AICompletionResponse, AIStreamChunk } from '../types'

const DEFAULT_TIMEOUT = 30000 // 30 seconds
const DEFAULT_MODEL = 'claude-sonnet-4-20250514'

/**
 * Anthropic API Provider
 * Uses the Anthropic API directly (requires ANTHROPIC_API_KEY)
 * For production use
 */
export class AnthropicProvider implements AIProvider {
  name = 'anthropic' as const
  supportsStreaming = true
  private apiKey: string

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required for Anthropic provider')
    }
    this.apiKey = apiKey
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResponse> {
    const { messages, systemPrompt, maxTokens = 4096, temperature = 0.7, timeout = DEFAULT_TIMEOUT } = options

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: messages.map((msg) => ({
            role: msg.role === 'system' ? 'user' : msg.role,
            content: msg.content,
          })),
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Anthropic API error: ${error}`)
      }

      const data = await response.json()

      return {
        content: data.content[0].text,
        usage: {
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens,
        },
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Anthropic API timed out after ${timeout}ms`)
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }

  async *stream(options: AICompletionOptions): AsyncIterable<AIStreamChunk> {
    const { messages, systemPrompt, maxTokens = 4096, temperature = 0.7 } = options

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        stream: true,
        messages: messages.map((msg) => ({
          role: msg.role === 'system' ? 'user' : msg.role,
          content: msg.content,
        })),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      yield { type: 'error', error: `Anthropic API error: ${error}` }
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      yield { type: 'error', error: 'No response body' }
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let usage = { inputTokens: 0, outputTokens: 0 }

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]' || !data) continue

            try {
              const event = JSON.parse(data)

              if (event.type === 'content_block_delta' && event.delta?.text) {
                yield { type: 'text', content: event.delta.text }
              } else if (event.type === 'message_delta' && event.usage) {
                usage.outputTokens = event.usage.output_tokens
              } else if (event.type === 'message_start' && event.message?.usage) {
                usage.inputTokens = event.message.usage.input_tokens
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      }

      yield { type: 'done', usage }
    } finally {
      reader.releaseLock()
    }
  }
}
