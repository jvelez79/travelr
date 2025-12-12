import { NextRequest } from 'next/server'
import { getAIProvider } from '@/lib/ai'
import {
  SYSTEM_PROMPT_PROGRESSIVE,
  GENERATE_SINGLE_DAY_PROMPT,
  GENERATE_SINGLE_DAY_WITH_PLACES_PROMPT,
  fillPrompt,
  getStyleRules,
  getPaceRules,
} from '@/lib/ai/prompts-progressive'
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

interface GenerateDayStreamRequest {
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
  placesContext?: Record<PlaceCategory, PlaceForAI[]> | null
}

/**
 * SSE endpoint for streaming day generation
 * Returns Server-Sent Events as the AI generates the day
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body: GenerateDayStreamRequest = await request.json()
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
    console.log('[generate-day-stream] Starting day', dayNumber, ':', dayTitle, hasPlacesContext ? '(with places)' : '(no places)')

    const ai = getAIProvider()

    // Check if provider supports streaming
    if (!ai.supportsStreaming || !ai.stream) {
      // Fallback to non-streaming
      console.log('[generate-day-stream] Provider does not support streaming, falling back')
      return fallbackToNonStreaming(body, ai, startTime)
    }

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
      placesJson,
      styleRules: getStyleRules(preferences.style),
      paceRules: getPaceRules(preferences.pace),
    })

    // Create SSE stream
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Start streaming in background
    streamDayGeneration(ai, prompt, writer, encoder, dayNumber, startTime)

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    })
  } catch (error) {
    console.error('[generate-day-stream] Error:', error)
    return new Response(
      `event: error\ndata: ${JSON.stringify({ error: 'Failed to start day generation' })}\n\n`,
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      }
    )
  }
}

async function streamDayGeneration(
  ai: ReturnType<typeof getAIProvider>,
  prompt: string,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  dayNumber: number,
  startTime: number
) {
  let fullContent = ''
  let lastSentIndex = 0
  let timelineEntries: unknown[] = []

  try {
    // Send start event
    await writer.write(encoder.encode(`event: start\ndata: ${JSON.stringify({ dayNumber })}\n\n`))

    // Stream from AI
    const streamIterator = ai.stream!({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: SYSTEM_PROMPT_PROGRESSIVE,
      maxTokens: 4000,
      temperature: 0.7,
    })

    for await (const chunk of streamIterator) {
      if (chunk.type === 'text' && chunk.content) {
        fullContent += chunk.content

        // Try to extract timeline entries as they appear
        const extracted = tryExtractTimelineEntries(fullContent, lastSentIndex)

        if (extracted.entries.length > timelineEntries.length) {
          // New entries found, send them
          for (let i = timelineEntries.length; i < extracted.entries.length; i++) {
            const entry = extracted.entries[i]
            await writer.write(
              encoder.encode(`event: timeline\ndata: ${JSON.stringify(entry)}\n\n`)
            )
          }
          timelineEntries = extracted.entries
          lastSentIndex = extracted.lastIndex
        }

        // Send raw chunk for progress indication
        await writer.write(
          encoder.encode(`event: chunk\ndata: ${JSON.stringify({ length: fullContent.length })}\n\n`)
        )
      } else if (chunk.type === 'done') {
        // Parse final result
        const finalDay = parseCompleteDayJSON(fullContent, dayNumber)

        const elapsed = Date.now() - startTime
        console.log('[generate-day-stream] Day', dayNumber, 'completed in', elapsed, 'ms')

        // Send complete event with full day data
        await writer.write(
          encoder.encode(`event: complete\ndata: ${JSON.stringify({ day: finalDay, elapsed })}\n\n`)
        )
      } else if (chunk.type === 'error') {
        await writer.write(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: chunk.error })}\n\n`)
        )
      }
    }
  } catch (error) {
    console.error('[generate-day-stream] Stream error:', error)
    await writer.write(
      encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Stream failed' })}\n\n`)
    )
  } finally {
    await writer.close()
  }
}

/**
 * Try to extract timeline entries from partial JSON
 * This is a best-effort parser for streaming
 */
function tryExtractTimelineEntries(content: string, startFrom: number): { entries: unknown[], lastIndex: number } {
  const entries: unknown[] = []

  // Look for timeline array
  const timelineMatch = content.indexOf('"timeline"')
  if (timelineMatch === -1) return { entries, lastIndex: startFrom }

  // Find the array start
  const arrayStart = content.indexOf('[', timelineMatch)
  if (arrayStart === -1) return { entries, lastIndex: startFrom }

  // Try to find complete objects within the timeline array
  let searchStart = Math.max(arrayStart, startFrom)
  let depth = 0
  let objectStart = -1

  for (let i = searchStart; i < content.length; i++) {
    const char = content[i]

    if (char === '{') {
      if (depth === 0) objectStart = i
      depth++
    } else if (char === '}') {
      depth--
      if (depth === 0 && objectStart !== -1) {
        // Found a complete object
        const objectStr = content.substring(objectStart, i + 1)
        try {
          const entry = JSON.parse(objectStr)
          if (entry.id && entry.time && entry.activity) {
            entries.push(entry)
            searchStart = i + 1
          }
        } catch {
          // Not valid JSON yet, continue
        }
        objectStart = -1
      }
    } else if (char === ']' && depth === 0) {
      // End of timeline array
      break
    }
  }

  return { entries, lastIndex: searchStart }
}

/**
 * Parse the complete JSON response
 */
function parseCompleteDayJSON(content: string, dayNumber: number) {
  // Extract JSON from content
  let jsonStr = content.trim()

  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```')) {
    const firstNewline = jsonStr.indexOf('\n')
    const lastBackticks = jsonStr.lastIndexOf('```')
    jsonStr = jsonStr.substring(firstNewline + 1, lastBackticks).trim()
  }

  // Try to find JSON object
  const jsonStart = jsonStr.indexOf('{')
  const jsonEnd = jsonStr.lastIndexOf('}')
  if (jsonStart !== -1 && jsonEnd !== -1) {
    jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1)
  }

  try {
    return JSON.parse(jsonStr)
  } catch (error) {
    console.error('[generate-day-stream] JSON parse error, attempting repair')
    // Attempt basic repair
    return repairAndParse(jsonStr, dayNumber)
  }
}

/**
 * Attempt to repair malformed JSON
 */
function repairAndParse(jsonStr: string, dayNumber: number) {
  try {
    // Remove trailing commas
    let repaired = jsonStr.replace(/,\s*([}\]])/g, '$1')

    // Close unclosed brackets
    let openBraces = (repaired.match(/{/g) || []).length
    let closeBraces = (repaired.match(/}/g) || []).length
    while (closeBraces < openBraces) {
      repaired += '}'
      closeBraces++
    }

    let openBrackets = (repaired.match(/\[/g) || []).length
    let closeBrackets = (repaired.match(/\]/g) || []).length
    while (closeBrackets < openBrackets) {
      repaired += ']'
      closeBrackets++
    }

    return JSON.parse(repaired)
  } catch {
    // Return minimal day structure on complete failure
    return {
      day: dayNumber,
      title: `Día ${dayNumber}`,
      timeline: [],
      meals: {},
      importantNotes: [],
      transport: '',
      overnight: '',
    }
  }
}

/**
 * Fallback for providers that don't support streaming
 */
async function fallbackToNonStreaming(
  body: GenerateDayStreamRequest,
  ai: ReturnType<typeof getAIProvider>,
  startTime: number
) {
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
  const basePrompt = hasPlacesContext
    ? GENERATE_SINGLE_DAY_WITH_PLACES_PROMPT
    : GENERATE_SINGLE_DAY_PROMPT

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
    placesJson,
    styleRules: getStyleRules(preferences.style),
    paceRules: getPaceRules(preferences.pace),
  })

  const response = await ai.complete({
    messages: [{ role: 'user', content: prompt }],
    systemPrompt: SYSTEM_PROMPT_PROGRESSIVE,
    maxTokens: 4000,
    temperature: 0.7,
    timeout: 45000,
  })

  const day = parseCompleteDayJSON(response.content, dayNumber)
  const elapsed = Date.now() - startTime

  // Return as SSE format for consistency
  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Send all events at once
  ;(async () => {
    await writer.write(encoder.encode(`event: start\ndata: ${JSON.stringify({ dayNumber })}\n\n`))

    // Send timeline entries
    if (day.timeline) {
      for (const entry of day.timeline) {
        await writer.write(encoder.encode(`event: timeline\ndata: ${JSON.stringify(entry)}\n\n`))
      }
    }

    await writer.write(encoder.encode(`event: complete\ndata: ${JSON.stringify({ day, elapsed })}\n\n`))
    await writer.close()
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
