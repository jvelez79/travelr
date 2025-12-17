import { NextRequest, NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai'
import { logAIRequest } from '@/lib/ai/logging'
import { getModelForProvider } from '@/lib/ai/pricing'
import { SYSTEM_PROMPT, CONTEXTUAL_QUESTIONS_PROMPT, fillPrompt } from '@/lib/ai/prompts'
import { parseAIResponse } from '@/lib/ai/utils'

const AI_TIMEOUT = 30000 // 30 seconds

// Calculate number of days between dates
function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
}

interface TripContext {
  destination: string
  origin: string
  startDate: string
  endDate: string
  travelers: number
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { trip } = await request.json() as { trip: TripContext }

    if (!trip || !trip.destination || typeof trip.destination !== 'string') {
      return NextResponse.json(
        { questions: [], error: 'Trip with destination is required' },
        { status: 400 }
      )
    }

    const { destination, origin, startDate, endDate, travelers } = trip
    const days = calculateDays(startDate, endDate)

    const ai = getAIProvider()

    const prompt = fillPrompt(CONTEXTUAL_QUESTIONS_PROMPT, {
      destination,
      origin: origin || 'No especificado',
      startDate: startDate || 'No especificado',
      endDate: endDate || 'No especificado',
      days: String(days),
      travelers: String(travelers || 1)
    })

    const response = await ai.complete({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: SYSTEM_PROMPT,
      maxTokens: 1000,
      temperature: 0.7,
      timeout: AI_TIMEOUT,
    })

    // Parse JSON from response (handles markdown code blocks)
    const parsed = parseAIResponse<{ questions?: unknown[] }>(response.content, 'contextual-questions')

    const duration = Date.now() - startTime

    // Log AI request
    logAIRequest({
      endpoint: '/api/ai/contextual-questions',
      provider: ai.name,
      model: getModelForProvider(ai.name),
      inputTokens: response.usage?.inputTokens ?? 0,
      outputTokens: response.usage?.outputTokens ?? 0,
      durationMs: duration,
      startedAt: new Date(startTime),
      completedAt: new Date(),
      status: 'success',
      metadata: { destination },
    }).catch(console.error)

    if (!parsed) {
      return NextResponse.json({ questions: [] })
    }

    return NextResponse.json({ questions: parsed.questions || [] })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Contextual questions error:', errorMessage)

    // Log error
    logAIRequest({
      endpoint: '/api/ai/contextual-questions',
      provider: 'unknown',
      inputTokens: 0,
      outputTokens: 0,
      durationMs: duration,
      startedAt: new Date(startTime),
      completedAt: new Date(),
      status: 'error',
      errorMessage,
    }).catch(console.error)

    // Return empty array with error info - contextual questions are optional
    // but we include error info for debugging
    return NextResponse.json({
      questions: [],
      error: errorMessage.includes('timed out')
        ? 'AI request timed out. Please try again.'
        : 'Failed to generate questions. Using defaults.'
    })
  }
}
