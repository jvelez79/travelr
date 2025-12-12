import { NextRequest } from 'next/server'
import { getAIProvider } from '@/lib/ai'
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

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of ai.stream!({
            messages: [{ role: 'user', content: prompt }],
            systemPrompt: SYSTEM_PROMPT,
            maxTokens: 32000,
            temperature: 0.7,
          })) {
            const sseData = `data: ${JSON.stringify(chunk)}\n\n`
            controller.enqueue(encoder.encode(sseData))
          }
          controller.close()
        } catch (error) {
          console.error('[generate-plan-stream] Stream error:', error)
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
    console.error('[generate-plan-stream] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to start stream' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
