import { NextRequest } from 'next/server'
import { getAIProvider } from '@/lib/ai'
import { logAIRequest } from '@/lib/ai/logging'
import { getModelForProvider } from '@/lib/ai/pricing'
import { SYSTEM_PROMPT, GENERATE_PLAN_PROMPT, fillPrompt } from '@/lib/ai/prompts'
import type { TravelPreferences } from '@/types/plan'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface GeneratePlanRequest {
  trip: {
    destination: string
    origin: string
    startDate: string
    endDate: string
    travelers: number
  }
  preferences: TravelPreferences
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: GeneratePlanRequest = await request.json()
    const { trip, preferences } = body

    console.log('[generate-plan-stream] Starting with:', { destination: trip.destination, style: preferences.style })

    const ai = getAIProvider()
    console.log('[generate-plan-stream] Using AI provider:', ai.name, 'supportsStreaming:', ai.supportsStreaming)

    const prompt = fillPrompt(GENERATE_PLAN_PROMPT, {
      destination: trip.destination,
      origin: trip.origin,
      startDate: trip.startDate,
      endDate: trip.endDate,
      travelers: trip.travelers,
      style: preferences.style,
      accommodationType: preferences.accommodationType,
      priority: preferences.priority,
      interests: preferences.interests?.join(', ') || 'general',
    })

    // If provider doesn't support streaming, fall back to complete()
    if (!ai.supportsStreaming || !ai.stream) {
      console.log('[generate-plan-stream] Provider does not support streaming, falling back to complete()')

      const response = await ai.complete({
        messages: [{ role: 'user', content: prompt }],
        systemPrompt: SYSTEM_PROMPT,
        maxTokens: 32000,
        temperature: 0.7,
        timeout: 300000, // 5 minutes for fallback
      })

      const duration = Date.now() - startTime

      // Log AI request (fallback path)
      logAIRequest({
        endpoint: '/api/ai/generate-plan-stream',
        provider: ai.name,
        model: getModelForProvider(ai.name),
        inputTokens: response.usage?.inputTokens ?? 0,
        outputTokens: response.usage?.outputTokens ?? 0,
        durationMs: duration,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        status: 'success',
        metadata: { destination: trip.destination, streaming: false },
      }).catch(console.error)

      // Return as a single SSE event
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: response.content })}\n\n`))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', usage: response.usage })}\n\n`))
          controller.close()
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Streaming response
    console.log('[generate-plan-stream] Starting streaming response')
    const encoder = new TextEncoder()

    // Track usage for logging
    const totalUsage = { inputTokens: 0, outputTokens: 0 }
    const providerName = ai.name
    const model = getModelForProvider(ai.name)
    const metadata = { destination: trip.destination, streaming: true }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of ai.stream!({
            messages: [{ role: 'user', content: prompt }],
            systemPrompt: SYSTEM_PROMPT,
            maxTokens: 32000,
            temperature: 0.7,
          })) {
            // Capture usage from done chunk
            if (chunk.type === 'done' && chunk.usage) {
              totalUsage.inputTokens = chunk.usage.inputTokens || 0
              totalUsage.outputTokens = chunk.usage.outputTokens || 0
            }

            const sseData = `data: ${JSON.stringify(chunk)}\n\n`
            controller.enqueue(encoder.encode(sseData))
          }

          // Log successful stream completion
          const duration = Date.now() - startTime
          logAIRequest({
            endpoint: '/api/ai/generate-plan-stream',
            provider: providerName,
            model,
            inputTokens: totalUsage.inputTokens,
            outputTokens: totalUsage.outputTokens,
            durationMs: duration,
            startedAt: new Date(startTime),
            completedAt: new Date(),
            status: 'success',
            metadata,
          }).catch(console.error)

          controller.close()
        } catch (error) {
          console.error('[generate-plan-stream] Stream error:', error)

          // Log failed stream
          const duration = Date.now() - startTime
          logAIRequest({
            endpoint: '/api/ai/generate-plan-stream',
            provider: providerName,
            model,
            inputTokens: totalUsage.inputTokens,
            outputTokens: totalUsage.outputTokens,
            durationMs: duration,
            startedAt: new Date(startTime),
            completedAt: new Date(),
            status: 'error',
            errorMessage: String(error),
            metadata,
          }).catch(console.error)

          const errorChunk = { type: 'error', error: String(error) }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('[generate-plan-stream] Error:', error)

    // Log error
    logAIRequest({
      endpoint: '/api/ai/generate-plan-stream',
      provider: 'unknown',
      inputTokens: 0,
      outputTokens: 0,
      durationMs: duration,
      startedAt: new Date(startTime),
      completedAt: new Date(),
      status: 'error',
      errorMessage: error instanceof Error ? error.message : String(error),
    }).catch(console.error)

    return new Response(
      JSON.stringify({ error: 'Failed to start stream' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
