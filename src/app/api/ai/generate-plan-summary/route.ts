import { NextRequest, NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai'
import { SYSTEM_PROMPT_PROGRESSIVE, GENERATE_PLAN_SUMMARY_PROMPT, fillPrompt, getAccommodationRules, getStyleRules, getPaceRules } from '@/lib/ai/prompts-progressive'
import { parseAIResponse } from '@/lib/ai/utils'
import type { TravelPreferences } from '@/types/plan'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface GenerateSummaryRequest {
  trip: {
    destination: string
    origin: string
    startDate: string
    endDate: string
    travelers: number
  }
  preferences: TravelPreferences
}

// Calculate number of days
function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: GenerateSummaryRequest = await request.json()
    const { trip, preferences } = body
    const totalDays = calculateDays(trip.startDate, trip.endDate)

    console.log('[generate-plan-summary] Starting:', { destination: trip.destination, totalDays })

    const ai = getAIProvider()

    const prompt = fillPrompt(GENERATE_PLAN_SUMMARY_PROMPT, {
      destination: trip.destination,
      origin: trip.origin,
      startDate: trip.startDate,
      endDate: trip.endDate,
      travelers: trip.travelers,
      totalDays,
      priority: preferences.priority,
      interests: preferences.interests?.join(', ') || 'general',
      styleRules: getStyleRules(preferences.style),
      paceRules: getPaceRules(preferences.pace),
      accommodationRules: getAccommodationRules(preferences.accommodationType, trip.travelers),
    })

    const response = await ai.complete({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: SYSTEM_PROMPT_PROGRESSIVE,
      maxTokens: 4000,
      temperature: 0.7,
      timeout: 60000, // 60 seconds max
    })

    const parsed = parseAIResponse(response.content, 'generate-plan-summary')

    if (!parsed) {
      console.error('[generate-plan-summary] Failed to parse response')
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    const elapsed = Date.now() - startTime
    console.log('[generate-plan-summary] Completed in', elapsed, 'ms', {
      inputTokens: response.usage?.inputTokens,
      outputTokens: response.usage?.outputTokens,
    })

    return NextResponse.json({
      summary: parsed,
      totalDays,
      usage: response.usage,
      elapsed,
    })
  } catch (error) {
    console.error('[generate-plan-summary] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate plan summary' },
      { status: 500 }
    )
  }
}
