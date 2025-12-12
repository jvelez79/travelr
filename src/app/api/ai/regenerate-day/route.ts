import { NextRequest, NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai'
import { SYSTEM_PROMPT, REGENERATE_DAY_PROMPT, fillPrompt } from '@/lib/ai/prompts'
import { parseAIResponse } from '@/lib/ai/utils'
import type { GeneratedPlan } from '@/types/plan'

const AI_TIMEOUT = 45000 // 45 seconds for day regeneration

interface RegenerateDayRequest {
  plan: GeneratedPlan
  dayNumber: number
  feedback: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RegenerateDayRequest = await request.json()
    const { plan, dayNumber, feedback } = body

    const ai = getAIProvider()

    const currentDay = plan.itinerary.find(d => d.day === dayNumber)
    const previousDay = plan.itinerary.find(d => d.day === dayNumber - 1)
    const nextDay = plan.itinerary.find(d => d.day === dayNumber + 1)

    const prompt = fillPrompt(REGENERATE_DAY_PROMPT, {
      dayNumber,
      userFeedback: feedback,
      currentDay: JSON.stringify(currentDay, null, 2),
      destination: plan.trip.destination,
      style: plan.preferences.style,
      previousDay: previousDay ? JSON.stringify(previousDay, null, 2) : 'N/A (primer día)',
      nextDay: nextDay ? JSON.stringify(nextDay, null, 2) : 'N/A (último día)',
    })

    const response = await ai.complete({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: SYSTEM_PROMPT,
      maxTokens: 2000,
      temperature: 0.7,
      timeout: AI_TIMEOUT,
    })

    // Parse JSON from response (handles markdown code blocks)
    const parsed = parseAIResponse(response.content, 'regenerate-day')
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 })
    }

    return NextResponse.json({ day: parsed })
  } catch (error) {
    console.error('Regenerate day error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    const isTimeout = message.includes('timed out')
    return NextResponse.json(
      {
        error: isTimeout
          ? 'La regeneración del día tardó demasiado. Por favor, intenta de nuevo.'
          : 'Error al regenerar el día. Por favor, intenta de nuevo.'
      },
      { status: isTimeout ? 504 : 500 }
    )
  }
}
