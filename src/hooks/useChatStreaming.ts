/**
 * useChatStreaming Hook
 *
 * Processes Server-Sent Events (SSE) streams from the AI Travel Agent API.
 * Handles text streaming, tool calls, tool results, and error events.
 */

import { useCallback, useRef } from 'react'
import type { ChatStreamEvent } from '@/types/ai-agent'

interface UseChatStreamingOptions {
  onTextChunk: (text: string) => void
  onToolCall?: (toolName: string, toolInput: Record<string, unknown>) => void
  onToolResult?: (toolName: string, result: string) => void
  onDone: (data?: any) => void
  onError: (error: string) => void
}

export function useChatStreaming() {
  const eventSourceRef = useRef<EventSource | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Start streaming a chat message
   */
  const startStream = useCallback(async (
    url: string,
    body: Record<string, unknown>,
    options: UseChatStreamingOptions
  ) => {
    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    try {
      // Make POST request to initiate SSE stream
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      // Read SSE stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true })

        // Process complete events in buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6) // Remove 'data: ' prefix

            try {
              const event: ChatStreamEvent = JSON.parse(data)

              // Handle different event types
              switch (event.type) {
                case 'text':
                  if (event.content) {
                    options.onTextChunk(event.content)
                  }
                  break

                case 'tool_call':
                  if (event.toolName && event.toolInput && options.onToolCall) {
                    options.onToolCall(event.toolName, event.toolInput)
                  }
                  break

                case 'tool_result':
                  if (event.toolName && event.toolResult && options.onToolResult) {
                    options.onToolResult(event.toolName, event.toolResult)
                  }
                  break

                case 'done':
                  const doneData = event.content ? JSON.parse(event.content) : undefined
                  options.onDone(doneData)
                  break

                case 'error':
                  options.onError(event.error || 'Unknown error')
                  break
              }
            } catch (parseError) {
              console.error('[useChatStreaming] Error parsing SSE event:', parseError)
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[useChatStreaming] Stream aborted')
      } else {
        console.error('[useChatStreaming] Stream error:', error)
        options.onError(error instanceof Error ? error.message : 'Unknown error')
      }
    } finally {
      abortControllerRef.current = null
    }
  }, [])

  /**
   * Cancel active stream
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  return {
    startStream,
    cancelStream,
  }
}
