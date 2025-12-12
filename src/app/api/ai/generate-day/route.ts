import { NextRequest, NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai'
import {
  SYSTEM_PROMPT_PROGRESSIVE,
  GENERATE_SINGLE_DAY_PROMPT,
  GENERATE_SINGLE_DAY_WITH_PLACES_PROMPT,
  fillPrompt,
  getStyleRules,
  getPaceRules,
} from '@/lib/ai/prompts-progressive'
import { parseAIResponse } from '@/lib/ai/utils'
import type { TravelPreferences } from '@/types/plan'
import type { PlaceCategory } from '@/types/explore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Simplified place for AI prompts
interface PlaceForAI {
  id: string
  name: string
  type: string
  rating?: number
  priceLevel?: string
  location: string
}

interface GenerateDayRequest {
  trip: {
    destination: string
    origin: string
    startDate: string
    endDate: string
    travelers: number
  }
  preferences: TravelPreferences
  dayNumber: number
  dayTitle: string
  date: string
  previousDaySummary?: string
  nextDayTitle?: string
  // NEW: Google Places context for AI
  placesContext?: Record<PlaceCategory, PlaceForAI[]> | null
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: GenerateDayRequest = await request.json()
    const {
      trip,
      preferences,
      dayNumber,
      dayTitle,
      date,
      previousDaySummary,
      nextDayTitle,
      placesContext,
    } = body

    const hasPlacesContext = placesContext && Object.keys(placesContext).length > 0
    console.log('[generate-day] Starting day', dayNumber, ':', dayTitle, hasPlacesContext ? '(with places)' : '(no places)')

    const ai = getAIProvider()

    // Choose prompt based on whether we have places context
    const basePrompt = hasPlacesContext
      ? GENERATE_SINGLE_DAY_WITH_PLACES_PROMPT
      : GENERATE_SINGLE_DAY_PROMPT

    // Format places JSON for the prompt (if available)
    const placesJson = hasPlacesContext
      ? JSON.stringify(placesContext, null, 2)
      : 'No hay lugares precargados'

    const prompt = fillPrompt(basePrompt, {
      destination: trip.destination,
      priority: preferences.priority,
      interests: preferences.interests?.join(', ') || 'general',
      travelers: trip.travelers,
      dayNumber,
      date,
      dayTitle,
      previousDaySummary: previousDaySummary || 'Primer día del viaje',
      nextDayTitle: nextDayTitle || 'Último día del viaje',
      placesJson, // Places context for the AI
      styleRules: getStyleRules(preferences.style),
      paceRules: getPaceRules(preferences.pace),
    })

    const response = await ai.complete({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: SYSTEM_PROMPT_PROGRESSIVE,
      maxTokens: 4000,
      temperature: 0.7,
      timeout: 45000, // 45 seconds max per day
    })

    const parsed = parseAIResponse(response.content, `generate-day-${dayNumber}`)

    if (!parsed) {
      console.error('[generate-day] Failed to parse response for day', dayNumber)
      return NextResponse.json(
        { error: `Failed to parse day ${dayNumber}` },
        { status: 500 }
      )
    }

    const elapsed = Date.now() - startTime
    console.log('[generate-day] Day', dayNumber, 'completed in', elapsed, 'ms', {
      inputTokens: response.usage?.inputTokens,
      outputTokens: response.usage?.outputTokens,
    })

    return NextResponse.json({
      day: parsed,
      usage: response.usage,
      elapsed,
    })
  } catch (error) {
    console.error('[generate-day] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate day' },
      { status: 500 }
    )
  }
}
