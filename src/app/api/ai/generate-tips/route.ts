import { NextRequest, NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai'
import { logAIRequest } from '@/lib/ai/logging'
import { getModelForProvider } from '@/lib/ai/pricing'
import { SYSTEM_PROMPT, GENERATE_TIPS_PROMPT, fillPrompt } from '@/lib/ai/prompts'
import { parseAIResponse } from '@/lib/ai/utils'

const AI_TIMEOUT = 30000 // 30 seconds

interface GenerateTipsRequest {
  destination: string
  itinerarySummary: string
}

interface TipsResponse {
  tips: string[]
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: GenerateTipsRequest = await request.json()
    const { destination, itinerarySummary } = body

    const ai = getAIProvider()

    const prompt = fillPrompt(GENERATE_TIPS_PROMPT, {
      destination,
      itinerarySummary,
    })

    const response = await ai.complete({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: SYSTEM_PROMPT,
      maxTokens: 1000,
      temperature: 0.6,
      timeout: AI_TIMEOUT,
    })

    const parsed = parseAIResponse<TipsResponse>(response.content, 'generate-tips')
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 })
    }

    const duration = Date.now() - startTime
    console.log(`[AI] generate-tips completed in ${duration}ms`)

    // Log AI request
    logAIRequest({
      endpoint: '/api/ai/generate-tips',
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

    return NextResponse.json({ tips: parsed.tips || [] })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[AI] generate-tips failed after ${duration}ms:`, error)

    // Log error
    logAIRequest({
      endpoint: '/api/ai/generate-tips',
      provider: 'unknown',
      inputTokens: 0,
      outputTokens: 0,
      durationMs: duration,
      startedAt: new Date(startTime),
      completedAt: new Date(),
      status: 'error',
      errorMessage: error instanceof Error ? error.message : String(error),
    }).catch(console.error)

    const message = error instanceof Error ? error.message : 'Unknown error'
    const isTimeout = message.includes('timed out')

    return NextResponse.json(
      {
        error: isTimeout
          ? 'La generación de consejos tardó demasiado.'
          : 'Error al generar consejos.'
      },
      { status: isTimeout ? 504 : 500 }
    )
  }
}
