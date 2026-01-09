import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildTravelAgentSystemPrompt, buildConversationMessages } from '@/lib/ai/travel-agent-prompts'
import { TRAVEL_AGENT_TOOLS, executeToolCall, validateToolInput } from '@/lib/ai/travel-agent-tools'
import type { ChatRequest, ChatStreamEvent } from '@/types/ai-agent'
import type { GeneratedPlan } from '@/types/plan'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Simple in-memory rate limiter (5 messages per minute per user)
// NOTE: In production with multiple instances, use Redis or similar
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 5 // messages
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute in ms

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    // Reset or create new window
    rateLimitMap.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    })
    return { allowed: true }
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((userLimit.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  // Increment count
  userLimit.count++
  return { allowed: true }
}

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [userId, limit] of rateLimitMap.entries()) {
    if (now > limit.resetAt) {
      rateLimitMap.delete(userId)
    }
  }
}, 5 * 60 * 1000)

/**
 * POST /api/ai/travel-agent/chat
 *
 * Endpoint for AI Travel Agent chat interactions.
 * Receives a user message, loads trip context, invokes Anthropic API with tools,
 * and returns a Server-Sent Events stream with the response.
 *
 * Milestone 5: SSE streaming implementation
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  // Create a TransformStream for SSE
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Helper to send SSE events
  const sendEvent = async (event: ChatStreamEvent) => {
    const data = JSON.stringify(event)
    await writer.write(encoder.encode(`data: ${data}\n\n`))
  }

  // Helper to close stream
  const closeStream = async () => {
    await writer.close()
  }

  // Start async processing
  ;(async () => {
    try {
      // 1. Authenticate user
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        await sendEvent({ type: 'error', error: 'Unauthorized' })
        await closeStream()
        return
      }

      // Check rate limit
      const rateLimitCheck = checkRateLimit(user.id)
      if (!rateLimitCheck.allowed) {
        await sendEvent({
          type: 'error',
          error: `Demasiados mensajes. Por favor espera ${rateLimitCheck.retryAfter} segundos.`,
        })
        await closeStream()
        return
      }

      // 2. Parse request body
      const body: ChatRequest = await request.json()
      const { tripId, conversationId, message } = body

      if (!tripId) {
        await sendEvent({ type: 'error', error: 'tripId is required' })
        await closeStream()
        return
      }

      if (!message || message.trim().length === 0) {
        await sendEvent({ type: 'error', error: 'message cannot be empty' })
        await closeStream()
        return
      }

      // 3. Load trip data to verify ownership and get context
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('id, user_id, destination, origin, start_date, end_date, travelers')
        .eq('id', tripId)
        .single()

      if (tripError || !trip) {
        await sendEvent({ type: 'error', error: 'Trip not found' })
        await closeStream()
        return
      }

      if (trip.user_id !== user.id) {
        await sendEvent({ type: 'error', error: 'Unauthorized - trip belongs to another user' })
        await closeStream()
        return
      }

      // 4. Load plan from plans table
      const { data: planRow, error: planError } = await supabase
        .from('plans')
        .select('data')
        .eq('trip_id', tripId)
        .maybeSingle()

      if (planError) {
        console.error('[travel-agent/chat] Error loading plan:', planError)
        await sendEvent({ type: 'error', error: 'Failed to load trip plan' })
        await closeStream()
        return
      }

      if (!planRow) {
        await sendEvent({ type: 'error', error: 'Trip does not have a generated plan yet' })
        await closeStream()
        return
      }

      const plan = planRow.data as unknown as GeneratedPlan

      const tripContext = {
        destination: trip.destination,
        origin: trip.origin,
        startDate: trip.start_date,
        endDate: trip.end_date,
        travelers: trip.travelers || 1,
        currentDayCount: plan.itinerary?.length || 0,
      }

      // 5. Load conversation history (if conversationId provided)
      let conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = []

      if (conversationId) {
        const { data: messages } = await supabase
          .from('agent_messages')
          .select('role, content')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(20) // Last 20 messages for context

        if (messages) {
          conversationHistory = messages as Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
        }
      }

      // 6. Build system prompt and messages
      const systemPrompt = buildTravelAgentSystemPrompt(tripContext)
      const messages = buildConversationMessages(conversationHistory, message)

      // 7. Invoke Anthropic Messages API with streaming
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })

      console.log('[travel-agent/chat] Starting streaming response')

      // Create initial streaming call
      const responseStream = await anthropic.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        tools: TRAVEL_AGENT_TOOLS,
        messages,
      })

      let fullResponse = ''
      const toolCallsExecuted: Array<{
        toolName: string
        toolInput: Record<string, unknown>
        result: string
      }> = []

      // Process stream events
      for await (const event of responseStream) {
        if (event.type === 'content_block_start') {
          if (event.content_block.type === 'text') {
            // Text block started - no action needed
          } else if (event.content_block.type === 'tool_use') {
            // Tool use block started
            await sendEvent({
              type: 'tool_call',
              toolName: event.content_block.name,
              toolInput: event.content_block.input as Record<string, unknown>,
            })
          }
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            // Stream text token
            const text = event.delta.text
            fullResponse += text
            await sendEvent({
              type: 'text',
              content: text,
            })
          }
        } else if (event.type === 'message_stop') {
          // Message complete - check if we need to handle tool calls
          break
        }
      }

      // Get final message to check for tool calls
      const finalMessage = await responseStream.finalMessage()

      // 8. Process tool calls if present
      let conversationMessages = [...messages]
      let currentResponse = finalMessage
      const MAX_TOOL_ITERATIONS = 5

      for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
        let hasToolCalls = false
        const toolResults: Array<{ tool_use_id: string; type: 'tool_result'; content: string }> = []

        // Process content blocks for tool calls
        for (const block of currentResponse.content) {
          if (block.type === 'tool_use') {
            hasToolCalls = true
            const toolName = block.name
            const toolInput = block.input as Record<string, unknown>
            const toolUseId = block.id

            console.log('[travel-agent/chat] Executing tool:', toolName)

            // Send tool_call event
            await sendEvent({
              type: 'tool_call',
              toolName,
              toolInput,
            })

            // Validate tool input
            if (!validateToolInput(toolName, toolInput)) {
              console.error('[travel-agent/chat] Invalid tool input for', toolName)
              const errorResult = 'Error: Invalid tool input parameters'
              toolResults.push({
                tool_use_id: toolUseId,
                type: 'tool_result',
                content: errorResult,
              })
              await sendEvent({
                type: 'tool_result',
                toolName,
                toolResult: errorResult,
              })
              continue
            }

            // Reload plan for fresh state
            const { data: freshPlanRow } = await supabase
              .from('plans')
              .select('data')
              .eq('trip_id', tripId)
              .maybeSingle()

            const freshPlan = (freshPlanRow?.data as unknown as GeneratedPlan) || plan

            // Execute tool
            const toolResult = await executeToolCall(toolName, toolInput, {
              tripId,
              userId: user.id,
              plan: freshPlan,
              supabase,
            })

            toolCallsExecuted.push({
              toolName,
              toolInput,
              result: toolResult,
            })

            toolResults.push({
              tool_use_id: toolUseId,
              type: 'tool_result',
              content: toolResult,
            })

            // Send tool_result event
            await sendEvent({
              type: 'tool_result',
              toolName,
              toolResult,
            })
          }
        }

        // If no tool calls, we're done
        if (!hasToolCalls) {
          break
        }

        // Continue conversation with tool results
        conversationMessages.push({
          role: 'assistant',
          content: currentResponse.content,
        })

        conversationMessages.push({
          role: 'user',
          content: toolResults as any,
        })

        // Stream continuation
        console.log('[travel-agent/chat] Continuing conversation with tool results')
        const continuationStream = await anthropic.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: systemPrompt,
          tools: TRAVEL_AGENT_TOOLS,
          messages: conversationMessages,
        })

        // Process continuation stream
        for await (const event of continuationStream) {
          if (event.type === 'content_block_delta') {
            if (event.delta.type === 'text_delta') {
              const text = event.delta.text
              fullResponse += text
              await sendEvent({
                type: 'text',
                content: text,
              })
            }
          }
        }

        currentResponse = await continuationStream.finalMessage()
      }

      // 9. Create or update conversation in DB
      let activeConversationId = conversationId

      if (!activeConversationId) {
        const { data: newConversation, error: convError } = await supabase
          .from('agent_conversations')
          .insert({
            trip_id: tripId,
            user_id: user.id,
            title: message.slice(0, 50),
          })
          .select('id')
          .single()

        if (convError || !newConversation) {
          console.error('[travel-agent/chat] Failed to create conversation:', convError)
        } else {
          activeConversationId = newConversation.id
        }
      }

      // 10. Save messages to DB
      if (activeConversationId) {
        await supabase
          .from('agent_messages')
          .insert({
            conversation_id: activeConversationId,
            role: 'user',
            content: message,
          })

        await supabase
          .from('agent_messages')
          .insert({
            conversation_id: activeConversationId,
            role: 'assistant',
            content: fullResponse,
            tool_calls: toolCallsExecuted.length > 0 ? JSON.parse(JSON.stringify(toolCallsExecuted)) : null,
          })
      }

      // 11. Send done event
      await sendEvent({
        type: 'done',
        content: JSON.stringify({
          conversationId: activeConversationId,
          toolCallsCount: toolCallsExecuted.length,
        }),
      })

    } catch (error) {
      console.error('[travel-agent/chat] Error:', error)

      // Send error event
      const errorMessage = error instanceof Anthropic.APIError
        ? `AI service error: ${error.message}`
        : 'Failed to process chat message'

      await sendEvent({
        type: 'error',
        error: errorMessage,
      })
    } finally {
      await closeStream()
    }
  })()

  // Return streaming response
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
