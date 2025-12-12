import { NextRequest, NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai'
import { SYSTEM_PROMPT, GENERATE_PLAN_PROMPT, fillPrompt } from '@/lib/ai/prompts'
import { parseAIResponse } from '@/lib/ai/utils'
import type { TravelPreferences } from '@/types/plan'

const AI_TIMEOUT = 120000 // 120 seconds for enhanced plan generation

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

    console.log('[generate-plan] Starting with:', { destination: trip.destination, style: preferences.style })

    const ai = getAIProvider()
    console.log('[generate-plan] Using AI provider:', ai.name)

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

    console.log('[generate-plan] Calling AI...')
    const response = await ai.complete({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: SYSTEM_PROMPT,
      maxTokens: 16000, // Increased for enhanced itinerary format
      temperature: 0.7,
      timeout: AI_TIMEOUT,
    })
    console.log('[generate-plan] AI response received, length:', response.content.length)

    // Parse JSON from response (handles markdown code blocks)
    const parsed = parseAIResponse(response.content, 'generate-plan')
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid AI response - could not parse JSON' }, { status: 500 })
    }

    console.log('[generate-plan] Successfully parsed plan')
    return NextResponse.json({ plan: parsed })
  } catch (error) {
    console.error('[generate-plan] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    const isTimeout = message.includes('timed out')
    return NextResponse.json(
      {
        error: isTimeout
          ? 'La generación del plan tardó demasiado. Por favor, intenta de nuevo.'
          : `Error al generar el plan: ${message}`
      },
      { status: isTimeout ? 504 : 500 }
    )
  }
}
