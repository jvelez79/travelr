import { NextRequest, NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai'
import { SYSTEM_PROMPT, GENERATE_DOCUMENTS_PROMPT, fillPrompt } from '@/lib/ai/prompts'
import { parseAIResponse } from '@/lib/ai/utils'
import type { DocumentItem } from '@/types/plan'

const AI_TIMEOUT = 30000 // 30 seconds

interface GenerateDocumentsRequest {
  trip: {
    destination: string
    origin: string
    startDate: string
    endDate: string
    travelers: number
  }
}

interface DocumentsResponse {
  documents: Partial<DocumentItem>[]
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: GenerateDocumentsRequest = await request.json()
    const { trip } = body

    const ai = getAIProvider()

    const prompt = fillPrompt(GENERATE_DOCUMENTS_PROMPT, {
      destination: trip.destination,
      origin: trip.origin,
      startDate: trip.startDate,
      endDate: trip.endDate,
      travelers: trip.travelers,
    })

    const response = await ai.complete({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: SYSTEM_PROMPT,
      maxTokens: 1000,
      temperature: 0.5,
      timeout: AI_TIMEOUT,
    })

    const parsed = parseAIResponse<DocumentsResponse>(response.content, 'generate-documents')
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 })
    }

    const duration = Date.now() - startTime
    console.log(`[AI] generate-documents completed in ${duration}ms`)

    return NextResponse.json({ documents: parsed.documents || [] })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[AI] generate-documents failed after ${duration}ms:`, error)

    const message = error instanceof Error ? error.message : 'Unknown error'
    const isTimeout = message.includes('timed out')

    return NextResponse.json(
      {
        error: isTimeout
          ? 'La generación de documentos tardó demasiado.'
          : 'Error al generar documentos.'
      },
      { status: isTimeout ? 504 : 500 }
    )
  }
}
