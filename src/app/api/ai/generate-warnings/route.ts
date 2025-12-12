import { NextRequest, NextResponse } from 'next/server'
import { getAIProvider } from '@/lib/ai'
import { SYSTEM_PROMPT, GENERATE_WARNINGS_PROMPT, fillPrompt } from '@/lib/ai/prompts'
import { parseAIResponse } from '@/lib/ai/utils'

const AI_TIMEOUT = 30000 // 30 seconds

interface GenerateWarningsRequest {
  destination: string
  startDate: string
  endDate: string
}

interface WarningsResponse {
  warnings: string[]
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: GenerateWarningsRequest = await request.json()
    const { destination, startDate, endDate } = body

    const ai = getAIProvider()

    const prompt = fillPrompt(GENERATE_WARNINGS_PROMPT, {
      destination,
      startDate,
      endDate,
    })

    const response = await ai.complete({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: SYSTEM_PROMPT,
      maxTokens: 800,
      temperature: 0.4,
      timeout: AI_TIMEOUT,
    })

    const parsed = parseAIResponse<WarningsResponse>(response.content, 'generate-warnings')
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid AI response' }, { status: 500 })
    }

    const duration = Date.now() - startTime
    console.log(`[AI] generate-warnings completed in ${duration}ms`)

    return NextResponse.json({ warnings: parsed.warnings || [] })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[AI] generate-warnings failed after ${duration}ms:`, error)

    const message = error instanceof Error ? error.message : 'Unknown error'
    const isTimeout = message.includes('timed out')

    return NextResponse.json(
      {
        error: isTimeout
          ? 'La generación de advertencias tardó demasiado.'
          : 'Error al generar advertencias.'
      },
      { status: isTimeout ? 504 : 500 }
    )
  }
}
