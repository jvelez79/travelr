/**
 * useChatConversation Hook
 *
 * Manages chat conversation state:
 * - Loads conversation history from Supabase
 * - Sends messages to the API
 * - Persists messages to database
 * - Handles loading, error, and streaming states
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useChatStreaming } from './useChatStreaming'
import type { ChatMessage, ToolCall } from '@/types/ai-agent'

interface UseChatConversationOptions {
  tripId: string
  conversationId?: string | null
}

interface UseChatConversationReturn {
  messages: ChatMessage[]
  loading: boolean
  isStreaming: boolean
  error: Error | null
  sendMessage: (content: string) => Promise<void>
  clearHistory: () => Promise<void>
  conversationId: string | null
  canContinue: boolean
  continueConversation: () => Promise<void>
}

export function useChatConversation({
  tripId,
  conversationId: initialConversationId,
}: UseChatConversationOptions): UseChatConversationReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null)
  const [canContinue, setCanContinue] = useState(false)

  // Ref to track conversationId and avoid closure issues
  const conversationIdRef = useRef<string | null>(initialConversationId || null)

  const { user } = useAuth()
  const supabase = createClient()
  const abortControllerRef = useRef<AbortController | null>(null)
  const { startStream, cancelStream } = useChatStreaming()

  // Keep ref in sync with state
  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  // Load conversation history
  const loadHistory = useCallback(async () => {
    if (!user || !conversationId) {
      setMessages([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch messages for this conversation
      const { data, error: fetchError } = await supabase
        .from('agent_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError

      // Convert to ChatMessage format
      const chatMessages: ChatMessage[] = (data || []).map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: msg.created_at,
        toolCalls: msg.tool_calls ? (msg.tool_calls as unknown as ToolCall[]) : undefined,
        isStreaming: false,
      }))

      setMessages(chatMessages)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error loading messages'))
    } finally {
      setLoading(false)
    }
  }, [user, conversationId, supabase])

  // Load history for a specific conversation (avoids closure issues)
  const loadHistoryForConversation = useCallback(async (convId: string) => {
    if (!user || !convId) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('agent_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError

      const chatMessages: ChatMessage[] = (data || []).map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: msg.created_at,
        toolCalls: msg.tool_calls ? (msg.tool_calls as unknown as ToolCall[]) : undefined,
        isStreaming: false,
      }))

      setMessages(chatMessages)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error loading messages'))
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Find existing conversation for trip (if no conversationId provided)
  const findExistingConversation = useCallback(async () => {
    if (!user || !tripId || conversationId) return

    try {
      // Look for the most recent conversation for this trip
      const { data, error: fetchError } = await supabase
        .from('agent_conversations')
        .select('id')
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fetchError) {
        console.error('[useChatConversation] Error finding conversation:', fetchError)
        setLoading(false)
        return
      }

      if (data) {
        console.log('[useChatConversation] Found existing conversation:', data.id)
        setConversationId(data.id)
        conversationIdRef.current = data.id
        // Load history will be triggered by the conversationId change
      } else {
        console.log('[useChatConversation] No existing conversation found for trip')
        setLoading(false)
      }
    } catch (err) {
      console.error('[useChatConversation] Error:', err)
      setLoading(false)
    }
  }, [user, tripId, conversationId, supabase])

  // On mount: find existing conversation or set loading to false
  useEffect(() => {
    if (!conversationId) {
      findExistingConversation()
    }
  }, [findExistingConversation, conversationId])

  // Load history when conversationId changes
  useEffect(() => {
    if (conversationId) {
      loadHistory()
    }
  }, [conversationId, loadHistory])

  // Create or get conversation
  const ensureConversation = useCallback(async (): Promise<string> => {
    if (conversationId) return conversationId

    if (!user) throw new Error('User not authenticated')

    // Create new conversation
    const { data, error: insertError } = await supabase
      .from('agent_conversations')
      .insert({
        trip_id: tripId,
        user_id: user.id,
        title: null, // Will be auto-generated by backend
      })
      .select()
      .single()

    if (insertError) throw insertError

    setConversationId(data.id)
    conversationIdRef.current = data.id
    return data.id
  }, [conversationId, user, tripId, supabase])

  // Send message to API with streaming
  const sendMessage = useCallback(async (content: string) => {
    if (!user || !content.trim()) return

    setIsStreaming(true)
    setError(null)

    // Add user message immediately (optimistic update)
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      isStreaming: false,
    }
    setMessages(prev => [...prev, userMessage])

    // Add placeholder for assistant response
    const assistantMessageId = `temp-assistant-${Date.now()}`
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      // Ensure we have a conversation
      const convId = await ensureConversation()

      // Start SSE stream
      await startStream(
        '/api/ai/travel-agent/chat',
        {
          tripId,
          conversationId: convId,
          message: content.trim(),
        },
        {
          onTextChunk: (text: string) => {
            // Append text to assistant message
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, content: msg.content + text }
                  : msg
              )
            )
          },
          onToolCall: (toolName: string, toolInput: Record<string, unknown>) => {
            console.log('[chat] Tool called:', toolName, toolInput)
            // Optionally show tool call indicator in UI
          },
          onToolResult: (toolName: string, result: string) => {
            console.log('[chat] Tool result:', toolName, result)
            // Optionally show tool result in UI
          },
          onDone: (data?: { conversationId?: string; toolCallsCount?: number; canContinue?: boolean }) => {
            console.log('[chat] Stream completed', data)
            // Mark assistant message as complete
            setMessages(prev =>
              prev.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            )
            setIsStreaming(false)

            // Update continuation state
            setCanContinue(data?.canContinue || false)

            // Use conversationId from done event (guaranteed to be correct)
            const finalConvId = data?.conversationId || conversationIdRef.current
            if (finalConvId) {
              // Update state if we got a new conversationId
              if (data?.conversationId && data.conversationId !== conversationIdRef.current) {
                setConversationId(data.conversationId)
                conversationIdRef.current = data.conversationId
              }

              // Reload history with the known conversationId
              setTimeout(() => {
                loadHistoryForConversation(finalConvId)
              }, 500)
            }
          },
          onError: (errorMsg: string) => {
            console.error('[chat] Stream error:', errorMsg)
            setError(new Error(errorMsg))
            // Remove placeholder messages on error
            setMessages(prev => prev.filter(msg =>
              msg.id !== userMessage.id && msg.id !== assistantMessageId
            ))
            setIsStreaming(false)
          },
        }
      )
    } catch (err) {
      console.error('[chat] Error:', err)
      // Remove placeholder messages on error
      setMessages(prev => prev.filter(msg =>
        msg.id !== userMessage.id && msg.id !== assistantMessageId
      ))

      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[chat] Request aborted')
      } else {
        setError(err instanceof Error ? err : new Error('Error sending message'))
      }
      setIsStreaming(false)
    }
  }, [user, tripId, ensureConversation, loadHistoryForConversation, startStream])

  // Clear conversation history
  const clearHistory = useCallback(async () => {
    if (!conversationId) return

    try {
      // Delete all messages in this conversation
      const { error: deleteError } = await supabase
        .from('agent_messages')
        .delete()
        .eq('conversation_id', conversationId)

      if (deleteError) throw deleteError

      setMessages([])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error clearing history'))
    }
  }, [conversationId, supabase])

  // Continue conversation when step limit was hit
  const continueConversation = useCallback(async () => {
    if (!canContinue) return
    setCanContinue(false) // Reset before sending
    await sendMessage('Continúa donde te quedaste.')
  }, [canContinue, sendMessage])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      cancelStream()
    }
  }, [cancelStream])

  return {
    messages,
    loading,
    isStreaming,
    error,
    sendMessage,
    clearHistory,
    conversationId,
    canContinue,
    continueConversation,
  }
}
