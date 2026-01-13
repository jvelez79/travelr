import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildTravelAgentSystemPrompt, buildConversationMessages } from '@/lib/ai/travel-agent-prompts'
import { TRAVEL_AGENT_TOOLS, executeToolCall, validateToolInput } from '@/lib/ai/travel-agent-tools'
import type { ChatRequest, ChatStreamEvent, PlaceChipData } from '@/types/ai-agent'
import type { GeneratedPlan } from '@/types/plan'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Maximum tool iterations to prevent infinite loops
// Increased from 5 to 12 to allow complex multi-step tasks
const MAX_TOOL_ITERATIONS = 12

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

// Interface for stream processing results
interface StreamProcessingResult {
  textContent: string
  pendingToolUses: Array<{
    id: string
    name: string
    input: Record<string, unknown>
  }>
}

/**
 * Process an Anthropic stream and extract text + tool uses
 */
async function processAnthropicStream(
  responseStream: AsyncIterable<any>,
  sendEvent: (event: ChatStreamEvent) => void
): Promise<StreamProcessingResult> {
  let textContent = ''
  const pendingToolUses: Array<{
    id: string
    name: string
    input: Record<string, unknown>
  }> = []
  let currentToolUse: { id: string; name: string; inputJson: string } | null = null

  for await (const event of responseStream) {
    if (event.type === 'content_block_start') {
      if (event.content_block.type === 'tool_use') {
        currentToolUse = {
          id: event.content_block.id,
          name: event.content_block.name,
          inputJson: '',
        }
        sendEvent({
          type: 'tool_call',
          toolName: event.content_block.name,
          toolInput: {},
        })
      }
    } else if (event.type === 'content_block_delta') {
      if (event.delta.type === 'text_delta') {
        const text = event.delta.text
        textContent += text
        sendEvent({
          type: 'text',
          content: text,
        })
      } else if (event.delta.type === 'input_json_delta' && currentToolUse) {
        currentToolUse.inputJson += event.delta.partial_json
      }
    } else if (event.type === 'content_block_stop') {
      if (currentToolUse) {
        try {
          const input = JSON.parse(currentToolUse.inputJson || '{}')
          pendingToolUses.push({
            id: currentToolUse.id,
            name: currentToolUse.name,
            input,
          })
        } catch {
          console.error('[travel-agent/chat] Failed to parse tool input JSON')
        }
        currentToolUse = null
      }
    } else if (event.type === 'message_stop') {
      break
    }
  }

  return { textContent, pendingToolUses }
}

/**
 * POST /api/ai/travel-agent/chat
 *
 * Endpoint for AI Travel Agent chat interactions.
 * Receives a user message, loads trip context, invokes Anthropic API with tools,
 * and returns a Server-Sent Events stream with the response.
 *
 * Uses ReadableStream pattern for proper lifecycle management.
 */
export async function POST(request: NextRequest) {
  // 1. Parse and validate request body FIRST (fail fast)
  let body: ChatRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { tripId, conversationId, message } = body

  if (!tripId) {
    return NextResponse.json({ error: 'tripId is required' }, { status: 400 })
  }

  if (!message || message.trim().length === 0) {
    return NextResponse.json({ error: 'message cannot be empty' }, { status: 400 })
  }

  // 2. Authenticate user BEFORE creating stream
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Check rate limit
  const rateLimitCheck = checkRateLimit(user.id)
  if (!rateLimitCheck.allowed) {
    return NextResponse.json(
      { error: `Demasiados mensajes. Por favor espera ${rateLimitCheck.retryAfter} segundos.` },
      { status: 429 }
    )
  }

  // 4. Load trip data to verify ownership
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id, user_id, destination, origin, start_date, end_date, travelers')
    .eq('id', tripId)
    .single()

  if (tripError || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  }

  if (trip.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized - trip belongs to another user' }, { status: 403 })
  }

  // 5. Load plan from plans table
  const { data: planRow, error: planError } = await supabase
    .from('plans')
    .select('data')
    .eq('trip_id', tripId)
    .maybeSingle()

  if (planError) {
    console.error('[travel-agent/chat] Error loading plan:', planError)
    return NextResponse.json({ error: 'Failed to load trip plan' }, { status: 500 })
  }

  if (!planRow) {
    return NextResponse.json({ error: 'Trip does not have a generated plan yet' }, { status: 400 })
  }

  const plan = planRow.data as unknown as GeneratedPlan

  // Debug: Log initial plan state
  console.log('[travel-agent/chat] Initial plan loaded, Day 1 activities:',
    plan?.itinerary?.[0]?.timeline?.map((a: any) => a.activity).join(', ') || 'none')

  // 6. Load conversation history (if conversationId provided)
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

  // 7. Build context for stream processing
  const tripContext = {
    destination: trip.destination,
    origin: trip.origin,
    startDate: trip.start_date,
    endDate: trip.end_date,
    travelers: trip.travelers || 1,
    currentDayCount: plan.itinerary?.length || 0,
  }

  const systemPrompt = buildTravelAgentSystemPrompt(tripContext)
  const apiMessages = buildConversationMessages(conversationHistory, message)

  // 8. Create ReadableStream with proper lifecycle
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send SSE events
      const sendEvent = (event: ChatStreamEvent) => {
        try {
          const data = JSON.stringify(event)
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch {
          // Controller may be closed, ignore
        }
      }

      try {
        // Initialize Anthropic client
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        })

        console.log('[travel-agent/chat] Starting streaming response')

        let fullResponse = ''
        const toolCallsExecuted: Array<{
          toolName: string
          toolInput: Record<string, unknown>
          result: string
        }> = []

        // Track places found during search_places tool calls
        const placesContext: Record<string, PlaceChipData> = {}

        // Track conversation messages for multi-turn tool execution
        let currentMessages = [...apiMessages]
        let iterationCount = 0

        // Tool execution loop - continues until no more tools are called
        while (iterationCount < MAX_TOOL_ITERATIONS) {
          iterationCount++
          console.log(`[travel-agent/chat] Processing iteration ${iterationCount}...`)

          // Create stream for this iteration
          const responseStream = await anthropic.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            system: systemPrompt,
            tools: TRAVEL_AGENT_TOOLS,
            messages: currentMessages,
          })

          // Process the stream
          const { textContent, pendingToolUses } = await processAnthropicStream(
            responseStream,
            sendEvent
          )
          fullResponse += textContent

          console.log(`[travel-agent/chat] Iteration ${iterationCount} complete, pending tools: ${pendingToolUses.length}`)

          // No tools to execute - we're done
          if (pendingToolUses.length === 0) {
            console.log('[travel-agent/chat] No more tools, completing')
            break
          }

          // Execute tools and collect results
          const toolResults: Array<{ tool_use_id: string; type: 'tool_result'; content: string }> = []

          for (const toolUse of pendingToolUses) {
            const toolName = toolUse.name
            const toolInput = toolUse.input
            const toolUseId = toolUse.id

            console.log('[travel-agent/chat] Executing tool:', toolName)

            // Validate tool input
            if (!validateToolInput(toolName, toolInput)) {
              console.error('[travel-agent/chat] Invalid tool input for', toolName)
              const errorResult = 'Error: Invalid tool input parameters'
              toolResults.push({
                tool_use_id: toolUseId,
                type: 'tool_result',
                content: errorResult,
              })
              sendEvent({
                type: 'tool_result',
                toolName,
                toolResult: errorResult,
              })
              continue
            }

            // Reload plan for fresh state
            const { data: freshPlanRow, error: freshPlanError } = await supabase
              .from('plans')
              .select('data')
              .eq('trip_id', tripId)
              .maybeSingle()

            if (freshPlanError) {
              console.error('[travel-agent/chat] Error reloading plan:', freshPlanError)
            }

            const freshPlan = (freshPlanRow?.data as unknown as GeneratedPlan) || plan

            // Debug: Log what plan we're using
            console.log('[travel-agent/chat] Fresh plan loaded:', !!freshPlanRow)
            if (freshPlan?.itinerary?.[0]?.timeline) {
              console.log('[travel-agent/chat] Day 1 activities:', freshPlan.itinerary[0].timeline.map((a: any) => a.activity).join(', '))
            }

            // Execute tool
            let toolResult = await executeToolCall(toolName, toolInput, {
              tripId,
              userId: user.id,
              plan: freshPlan,
              supabase,
            })

            // Capture place data from search tools for interactive chips
            if (toolName === 'search_place_by_name' || toolName === 'search_places_nearby' || toolName === 'search_accommodations') {
              try {
                // Parse the places JSON from tool result (supports both 'places' and 'accommodations' formats)
                const placesMatch = toolResult.match(/```(?:places|accommodations)\n([\s\S]*?)\n```/)
                if (placesMatch) {
                  const places = JSON.parse(placesMatch[1])
                  // Convert to PlaceChipData and store in context
                  const chipReferences: string[] = []
                  places.forEach((place: any) => {
                    // Handle both 'places' format (location) and 'accommodations' format (coordinates)
                    const location = place.location || place.coordinates || { lat: 0, lng: 0 }
                    placesContext[place.id] = {
                      id: place.id,
                      name: place.name,
                      rating: place.rating,
                      reviewCount: place.reviewCount,
                      category: place.category || 'accommodation',
                      priceLevel: place.priceLevel,
                      imageUrl: place.imageUrl,
                      address: place.address,
                      description: place.description,
                      location,
                    }
                    // Build chip reference for AI to use - show exact format to copy
                    const ratingStr = place.rating ? ` (★${place.rating})` : ''
                    chipReferences.push(`${place.name}${ratingStr} → USAR: [[place:${place.id}]]`)
                  })
                  console.log(`[travel-agent/chat] Captured ${places.length} places for interactive chips`)

                  // Send places context to frontend immediately so chips can render during streaming
                  sendEvent({
                    type: 'places_context',
                    placesContext: { ...placesContext },
                  })

                  // Append STRONG instructions for chip format
                  toolResult += `\n\n---
⚠️ **FORMATO OBLIGATORIO PARA MENCIONAR LUGARES:**

Cuando menciones estos lugares en tu respuesta, DEBES usar EXACTAMENTE este formato:
- Sintaxis: [[place:PLACE_ID]] (doble corchete, palabra "place", dos puntos, ID)
- NO uses [ID] ni [place:ID] - DEBE ser [[place:ID]]

**Copia y pega estos chips en tu respuesta:**
${chipReferences.join('\n')}

Ejemplo correcto: "Te recomiendo [[place:${places[0]?.id}]] para cenar"
Ejemplo INCORRECTO: "Te recomiendo [${places[0]?.id}]" ❌`
                }
              } catch (err) {
                console.error('[travel-agent/chat] Failed to parse places from tool result:', err)
              }
            }

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

            sendEvent({
              type: 'tool_result',
              toolName,
              toolResult,
            })
          }

          // Build messages for next iteration
          // Include text content if there was any before tools
          const fullAssistantContent: Array<any> = []
          if (textContent) {
            fullAssistantContent.push({ type: 'text', text: textContent })
          }
          fullAssistantContent.push(...pendingToolUses.map(t => ({
            type: 'tool_use' as const,
            id: t.id,
            name: t.name,
            input: t.input,
          })))

          currentMessages = [
            ...currentMessages,
            { role: 'assistant' as const, content: fullAssistantContent },
            { role: 'user' as const, content: toolResults },
          ]
        }

        // Check if we hit the limit with pending work
        const hitLimit = iterationCount >= MAX_TOOL_ITERATIONS
        let pendingToolCount = 0

        if (hitLimit) {
          // We need to check if there were pending tools in the last iteration
          // by making one more API call to see what Claude wants to do next
          console.warn('[travel-agent/chat] Reached max tool iterations, checking for pending work')
          fullResponse += '\n\n(He avanzado todo lo posible en este paso. Puedes pedirme que continúe si hay más trabajo pendiente.)'
        }

        console.log(`[travel-agent/chat] Completed after ${iterationCount} iteration(s), hitLimit: ${hitLimit}`)

        // Create or update conversation in DB
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

        // Post-process response to auto-correct place chip format
        // Convert [ChIJ...] or [place:ChIJ...] to [[place:ChIJ...]]
        let processedResponse = fullResponse
        const knownPlaceIds = Object.keys(placesContext)
        if (knownPlaceIds.length > 0) {
          for (const placeId of knownPlaceIds) {
            // Pattern 1: [ChIJ...] (single bracket, no "place:")
            const singleBracketPattern = new RegExp(`\\[${placeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g')
            // Pattern 2: [place:ChIJ...] (single bracket with "place:")
            const singleBracketPlacePattern = new RegExp(`\\[place:${placeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g')

            // Replace with correct format [[place:ID]]
            processedResponse = processedResponse.replace(singleBracketPattern, `[[place:${placeId}]]`)
            processedResponse = processedResponse.replace(singleBracketPlacePattern, `[[place:${placeId}]]`)
          }

          if (processedResponse !== fullResponse) {
            console.log('[travel-agent/chat] Auto-corrected place chip format in response')
          }
        }

        // Save messages to DB - MUST complete before sending done event
        let messagesSaved = false
        if (activeConversationId) {
          const { error: userMsgError } = await supabase
            .from('agent_messages')
            .insert({
              conversation_id: activeConversationId,
              role: 'user',
              content: message,
            })

          if (userMsgError) {
            console.error('[travel-agent/chat] Failed to save user message:', userMsgError)
          }

          const { error: assistantMsgError } = await supabase
            .from('agent_messages')
            .insert({
              conversation_id: activeConversationId,
              role: 'assistant',
              content: processedResponse,
              tool_calls: toolCallsExecuted.length > 0 ? JSON.parse(JSON.stringify(toolCallsExecuted)) : null,
              places_context: Object.keys(placesContext).length > 0 ? placesContext : null,
            })

          if (assistantMsgError) {
            console.error('[travel-agent/chat] Failed to save assistant message:', assistantMsgError)
          }

          messagesSaved = !userMsgError && !assistantMsgError
        }

        console.log('[travel-agent/chat] Messages saved to DB:', messagesSaved)

        // Send done event with continuation info - AFTER messages are saved
        sendEvent({
          type: 'done',
          content: JSON.stringify({
            conversationId: activeConversationId,
            toolCallsCount: toolCallsExecuted.length,
            canContinue: hitLimit,
            pendingToolCount: pendingToolCount,
            messagesSaved, // Tell frontend if it's safe to reload
          }),
        })

        console.log('[travel-agent/chat] Stream completed successfully')

      } catch (error) {
        console.error('[travel-agent/chat] Error:', error)

        // Determine error message
        let errorMessage: string
        const isAbortError = error instanceof Error &&
          (error.message.includes('aborted') || error.name === 'AbortError')

        if (isAbortError) {
          console.log('[travel-agent/chat] Request aborted, client may have disconnected')
          errorMessage = 'La solicitud fue cancelada. Por favor intenta de nuevo.'
        } else if (error instanceof Anthropic.APIError) {
          errorMessage = `AI service error: ${error.message}`
        } else {
          errorMessage = 'Failed to process chat message'
        }

        sendEvent({
          type: 'error',
          error: errorMessage,
        })
      } finally {
        controller.close()
      }
    },
  })

  // Return streaming response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
