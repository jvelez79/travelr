import { NextRequest, NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai'
import { SYSTEM_PROMPT, GENERATE_PACKING_PROMPT, fillPrompt } from '@/lib/ai/prompts'
import { parseAIResponse } from '@/lib/ai/utils'
import type { PackingItem } from '@/types/plan'

const AI_TIMEOUT = 30000 // 30 seconds

interface GeneratePackingRequest {
  trip: {
    destination: string
    origin: string
    startDate: string
    endDate: string
    travelers: number
  }
  activities: string[]
}

interface PackingResponse {
  packing: Partial<PackingItem>[]
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: GeneratePackingRequest = await request.json()
    const { trip, activities } = body

    const ai = getAIProvider()

    const prompt = fillPrompt(GENERATE_PACKING_PROMPT, {
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      travelers: trip.travelers,
      activities: activities.join(', '),
    })

    const response = await ai.complete({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: SYSTEM_PROMPT,
      maxTokens: 1500,
      temperature: 0.5,
      timeout: AI_TIMEOUT,
    })

    const parsed = parseAIResponse<PackingResponse>(response.content, 'generate-packing')
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 })
    }

    const duration = Date.now() - startTime
    console.log(`[AI] generate-packing completed in ${duration}ms`)

    return NextResponse.json({ packing: parsed.packing || [] })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[AI] generate-packing failed after ${duration}ms:`, error)

    const message = error instanceof Error ? error.message : 'Unknown error'
    const isTimeout = message.includes('timed out')

    return NextResponse.json(
      {
        error: isTimeout
          ? 'La generación de lista de empaque tardó demasiado.'
          : 'Error al generar lista de empaque.'
      },
      { status: isTimeout ? 504 : 500 }
    )
  }
}
