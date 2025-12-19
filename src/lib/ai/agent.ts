// Travel Planning Agent - Client-side functions that call API routes

import type {
  GeneratedPlan,
  TravelPreferences,
  ItineraryDay,
  ContextualQuestion,
  TimelineEntry,
  ImportantNote,
  AccommodationSuggestion,
  DocumentItem,
  PackingItem,
} from '@/types/plan'
import type { Accommodation } from '@/types/accommodation'
import { parseAIResponse } from './utils'
import { createMetricsCollector } from './metrics'

// Progress phases for streaming
type GenerationPhase = 'connecting' | 'analyzing' | 'researching' | 'creating' | 'calculating' | 'parsing' | 'done' | 'error'

interface GenerationProgress {
  phase: GenerationPhase
  content: string
  bytesReceived: number
  error?: string
}

interface TripBasics {
  destination: string
  origin: string
  startDate: string
  endDate: string
  travelers: number
}

interface GeneratePlanOptions {
  trip: TripBasics
  preferences: TravelPreferences
}

// Calculate number of days between dates
function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
}

// Trip context for contextual questions
interface TripContext {
  destination: string
  origin: string
  startDate: string
  endDate: string
  travelers: number
}

// Generate contextual questions based on trip context
export async function generateContextualQuestions(
  trip: TripContext
): Promise<ContextualQuestion[]> {
  try {
    const response = await fetch('/api/ai/contextual-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trip }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate questions')
    }

    const data = await response.json()
    return data.questions || []
  } catch (error) {
    console.error('Failed to generate contextual questions:', error)
    return []
  }
}

// Generate the initial travel plan
async function generateInitialPlan(
  options: GeneratePlanOptions
): Promise<GeneratedPlan> {
  const { trip, preferences } = options
  const totalDays = calculateDays(trip.startDate, trip.endDate)

  const response = await fetch('/api/ai/generate-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trip, preferences }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.error || 'Failed to generate plan'
    console.error('Generate plan error:', errorMessage)
    throw new Error(errorMessage)
  }

  const data = await response.json()
  const parsed = data.plan

  // Build complete plan with metadata
  const plan: GeneratedPlan = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    trip,
    preferences,
    summary: {
      title: parsed.summary?.title || `Viaje a ${trip.destination}`,
      description: parsed.summary?.description || '',
      highlights: parsed.summary?.highlights || [],
      totalDays,
      totalNights: totalDays - 1,
      totalDriving: parsed.summary?.totalDriving,
    },
    itinerary: (parsed.itinerary || []).map((day: ItineraryDay, index: number) => ({
      ...day,
      day: index + 1,
      // Map timeline entries with IDs
      timeline: day.timeline?.map((tl) => ({
        ...tl,
        id: tl.id || crypto.randomUUID(),
      })) || [],
      // Map activities with IDs
      activities: day.activities?.map((act) => ({
        ...act,
        id: act.id || crypto.randomUUID(),
      })) || [],
      // Ensure meals has proper structure
      meals: day.meals || {},
      // Ensure summary exists
      summary: day.summary || {
        duration: '',
        mainActivities: [],
      },
      // Map important notes with IDs
      importantNotes: day.importantNotes?.map((note) => ({
        ...note,
        id: note.id || crypto.randomUUID(),
      })) || [],
    })),
    accommodation: {
      type: preferences.accommodationType,
      suggestions: parsed.accommodation?.suggestions?.map((acc: { id?: string }, idx: number) => ({
        ...acc,
        id: acc.id || `acc-${idx + 1}`,
      })) || [],
      totalCost: parsed.accommodation?.totalCost || 0,
    },
    // Background sections - will be generated after initial load
    documentsStatus: 'idle',
    packingStatus: 'idle',
    tipsStatus: 'idle',
    warningsStatus: 'idle',
    aiGenerated: {
      provider: 'api',
      generatedAt: new Date().toISOString(),
      regenerations: 0,
    },
  }

  return plan
}

// Determine progress phase based on content length
function getPhaseFromContentLength(length: number): GenerationPhase {
  if (length < 500) return 'analyzing'
  if (length < 2000) return 'researching'
  if (length < 8000) return 'creating'
  return 'calculating'
}

// Generate the initial travel plan with streaming
async function generateInitialPlanStreaming(
  options: GeneratePlanOptions,
  onProgress: (progress: GenerationProgress) => void
): Promise<GeneratedPlan> {
  const { trip, preferences } = options
  const totalDays = calculateDays(trip.startDate, trip.endDate)

  onProgress({ phase: 'connecting', content: '', bytesReceived: 0 })

  const response = await fetch('/api/ai/generate-plan-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trip, preferences }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.error || 'Failed to generate plan'
    onProgress({ phase: 'error', content: '', bytesReceived: 0, error: errorMessage })
    throw new Error(errorMessage)
  }

  const contentType = response.headers.get('Content-Type')

  // If not SSE, handle as regular JSON (fallback)
  if (!contentType?.includes('text/event-stream')) {
    const data = await response.json()
    if (data.error) {
      throw new Error(data.error)
    }
    // Build plan from non-streaming response
    return buildPlanFromParsedData(data.plan, trip, preferences, totalDays)
  }

  // Process SSE stream
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let accumulatedContent = ''
  let bytesReceived = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      bytesReceived += value?.length || 0
      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          try {
            const chunk = JSON.parse(data)

            if (chunk.type === 'text' && chunk.content) {
              accumulatedContent += chunk.content
              onProgress({
                phase: getPhaseFromContentLength(accumulatedContent.length),
                content: accumulatedContent,
                bytesReceived,
              })
            } else if (chunk.type === 'error') {
              onProgress({ phase: 'error', content: accumulatedContent, bytesReceived, error: chunk.error })
              throw new Error(chunk.error)
            } else if (chunk.type === 'done') {
              // Stream complete
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue // Skip malformed JSON
            throw e
          }
        }
      }
    }

    onProgress({ phase: 'parsing', content: accumulatedContent, bytesReceived })

    // Parse the accumulated JSON response
    const parsed = parseAIResponse<Record<string, unknown>>(accumulatedContent, 'generate-plan-stream')
    if (!parsed) {
      console.error('[generate-plan-stream] Parsing failed, attempting minimal plan generation')

      // Create a minimal valid plan when parsing fails
      const minimalPlan = createMinimalPlan(trip, preferences, totalDays)
      onProgress({ phase: 'done', content: accumulatedContent, bytesReceived })
      return minimalPlan
    }

    const plan = buildPlanFromParsedData(parsed, trip, preferences, totalDays)

    onProgress({ phase: 'done', content: accumulatedContent, bytesReceived })

    return plan
  } finally {
    reader.releaseLock()
  }
}

// Build plan from parsed AI data (shared between streaming and non-streaming)
function buildPlanFromParsedData(
  parsed: Record<string, unknown>,
  trip: TripBasics,
  preferences: TravelPreferences,
  totalDays: number
): GeneratedPlan {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    trip,
    preferences,
    summary: {
      title: (parsed.summary as { title?: string })?.title || `Viaje a ${trip.destination}`,
      description: (parsed.summary as { description?: string })?.description || '',
      highlights: (parsed.summary as { highlights?: string[] })?.highlights || [],
      totalDays,
      totalNights: totalDays - 1,
      totalDriving: (parsed.summary as { totalDriving?: { distance: string; time: string } })?.totalDriving,
    },
    itinerary: ((parsed.itinerary as ItineraryDay[]) || []).map((day: ItineraryDay, index: number) => ({
      ...day,
      day: index + 1,
      timeline: day.timeline?.map((tl) => ({
        ...tl,
        id: tl.id || crypto.randomUUID(),
      })) || [],
      activities: day.activities?.map((act) => ({
        ...act,
        id: act.id || crypto.randomUUID(),
      })) || [],
      meals: day.meals || {},
      summary: day.summary || {
        duration: '',
        mainActivities: [],
      },
      importantNotes: day.importantNotes?.map((note) => ({
        ...note,
        id: note.id || crypto.randomUUID(),
      })) || [],
    })),
    accommodation: {
      type: preferences.accommodationType,
      suggestions: (parsed.accommodation as { suggestions?: Omit<AccommodationSuggestion, 'id'> & { id?: string }[] })?.suggestions?.map((acc, idx) => ({
        ...acc,
        id: acc.id || `acc-${idx + 1}`,
      })) as AccommodationSuggestion[] || [],
      totalCost: (parsed.accommodation as { totalCost?: number })?.totalCost || 0,
    },
    // Background sections - will be generated after initial load
    documentsStatus: 'idle',
    packingStatus: 'idle',
    tipsStatus: 'idle',
    warningsStatus: 'idle',
    aiGenerated: {
      provider: 'api',
      generatedAt: new Date().toISOString(),
      regenerations: 0,
    },
  }
}

// Progressive generation phases
type ProgressivePhase = 'starting' | 'prefetching' | 'summary' | 'day' | 'enriching' | 'assembling' | 'done' | 'error'

interface ProgressiveProgress {
  phase: ProgressivePhase
  totalDays: number
  currentDay?: number
  dayTitle?: string
  completedDays: number
  error?: string
  partialPlan?: Partial<GeneratedPlan>
  // Stats for place linking
  placeStats?: {
    totalItems: number
    linkedItems: number
  }
}

// Generate plan progressively - shows content as each day is generated
// Now with Google Places integration for real place linking
async function generatePlanProgressively(
  options: GeneratePlanOptions,
  onProgress: (progress: ProgressiveProgress) => void
): Promise<GeneratedPlan> {
  const { trip, preferences } = options
  const totalDays = calculateDays(trip.startDate, trip.endDate)

  onProgress({ phase: 'starting', totalDays, completedDays: 0 })

  try {
    // Step 0: Pre-fetch places in parallel with summary
    onProgress({ phase: 'prefetching', totalDays, completedDays: 0 })

    const placesPromise = fetch('/api/ai/prefetch-places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination: trip.destination }),
    }).then(res => res.ok ? res.json() : null).catch(() => null)

    // Step 1: Generate plan summary (in parallel with places fetch)
    onProgress({ phase: 'summary', totalDays, completedDays: 0 })

    const [placesData, summaryResponse] = await Promise.all([
      placesPromise,
      fetch('/api/ai/generate-plan-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip, preferences }),
      }),
    ])

    if (!summaryResponse.ok) {
      throw new Error('Failed to generate plan summary')
    }

    // Extract places context for AI (null if prefetch failed)
    const placesForAI = placesData?.placesForAI || null
    const fullPlaces = placesData?.fullPlaces || null

    const summaryData = await summaryResponse.json()
    const summaryParsed = summaryData.summary

    // Build partial plan with summary
    const partialPlan: Partial<GeneratedPlan> = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      trip,
      preferences,
      summary: {
        title: summaryParsed.summary?.title || `Viaje a ${trip.destination}`,
        description: summaryParsed.summary?.description || '',
        highlights: summaryParsed.summary?.highlights || [],
        totalDays,
        totalNights: totalDays - 1,
        totalDriving: summaryParsed.summary?.totalDriving,
      },
      accommodation: {
        type: preferences.accommodationType,
        suggestions: summaryParsed.accommodation?.suggestions?.map((acc: { id?: string }, idx: number) => ({
          ...acc,
          id: acc.id || `acc-${idx + 1}`,
        })) || [],
        totalCost: summaryParsed.accommodation?.totalCost || 0,
      },
      // Background sections - will be generated after initial load
      documentsStatus: 'idle',
      packingStatus: 'idle',
      tipsStatus: 'idle',
      warningsStatus: 'idle',
      itinerary: [], // Will be filled day by day
    }

    const dayTitles: string[] = summaryParsed.dayTitles || []

    // Step 2: Generate each day (with places context if available)
    const itinerary: ItineraryDay[] = []
    const startDate = new Date(trip.startDate)

    for (let i = 0; i < totalDays; i++) {
      const dayNumber = i + 1
      const dayDate = new Date(startDate)
      dayDate.setDate(startDate.getDate() + i)
      const dateStr = dayDate.toISOString().split('T')[0]
      const dayTitle = dayTitles[i] || `Día ${dayNumber}`

      onProgress({
        phase: 'day',
        totalDays,
        currentDay: dayNumber,
        dayTitle,
        completedDays: i,
        partialPlan: { ...partialPlan, itinerary: [...itinerary] },
      })

      // Get context from previous day
      const previousDaySummary = i > 0
        ? `${itinerary[i - 1].title}: ${itinerary[i - 1].summary?.mainActivities?.join(', ') || ''}`
        : undefined

      // Get next day title for context
      const nextDayTitle = i < totalDays - 1 ? dayTitles[i + 1] : undefined

      const dayResponse = await fetch('/api/ai/generate-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip,
          preferences,
          dayNumber,
          dayTitle,
          date: dateStr,
          previousDaySummary,
          nextDayTitle,
          // NEW: Pass places context for AI to reference
          placesContext: placesForAI,
        }),
      })

      if (!dayResponse.ok) {
        console.error(`Failed to generate day ${dayNumber}, using minimal day`)
        // Create minimal day on failure
        itinerary.push(createMinimalDay(dayNumber, dateStr, dayTitle, trip.destination))
        continue
      }

      const dayData = await dayResponse.json()
      const dayParsed = dayData.day

      // Normalize day data
      itinerary.push({
        ...dayParsed,
        day: dayNumber,
        date: dateStr,
        title: dayParsed.title || dayTitle,
        timeline: dayParsed.timeline?.map((tl: { id?: string }) => ({
          ...tl,
          id: tl.id || crypto.randomUUID(),
        })) || [],
        activities: dayParsed.activities?.map((act: { id?: string }) => ({
          ...act,
          id: act.id || crypto.randomUUID(),
        })) || [],
        meals: dayParsed.meals || {},
        summary: dayParsed.summary || { duration: '', mainActivities: [] },
        importantNotes: dayParsed.importantNotes?.map((note: { id?: string }) => ({
          ...note,
          id: note.id || crypto.randomUUID(),
        })) || [],
      })
    }

    // Step 3: Enrich itinerary with Google Places data
    let enrichedItinerary = itinerary
    let placeStats = { totalItems: 0, linkedItems: 0 }

    if (fullPlaces) {
      onProgress({ phase: 'enriching', totalDays, completedDays: totalDays })

      try {
        const enrichResponse = await fetch('/api/ai/enrich-itinerary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itinerary,
            fullPlaces,
          }),
        })

        if (enrichResponse.ok) {
          const enrichData = await enrichResponse.json()
          enrichedItinerary = enrichData.itinerary
          placeStats = {
            totalItems: enrichData.stats.totalItems,
            linkedItems: enrichData.stats.linkedItems,
          }
          console.log(`[generatePlanProgressively] Enriched: ${placeStats.linkedItems}/${placeStats.totalItems} items linked to Google Places`)
        }
      } catch (enrichError) {
        console.warn('[generatePlanProgressively] Enrichment failed, using raw itinerary:', enrichError)
      }
    }

    // Step 4: Assemble final plan
    onProgress({ phase: 'assembling', totalDays, completedDays: totalDays, placeStats })

    const finalPlan: GeneratedPlan = {
      ...(partialPlan as GeneratedPlan),
      itinerary: enrichedItinerary,
      aiGenerated: {
        provider: 'api-progressive-places',
        generatedAt: new Date().toISOString(),
        regenerations: 0,
      },
    }

    onProgress({ phase: 'done', totalDays, completedDays: totalDays, partialPlan: finalPlan, placeStats })

    return finalPlan
  } catch (error) {
    console.error('[generatePlanProgressively] Error:', error)
    onProgress({
      phase: 'error',
      totalDays,
      completedDays: 0,
      error: String(error),
    })
    throw error
  }
}

// Create a minimal day when generation fails
function createMinimalDay(
  dayNumber: number,
  date: string,
  title: string,
  destination: string
): ItineraryDay {
  return {
    day: dayNumber,
    date,
    title,
    timeline: [
      { id: crypto.randomUUID(), time: '09:00', activity: 'Explorar', location: destination, icon: '🚶' },
      { id: crypto.randomUUID(), time: '13:00', activity: 'Almuerzo', location: destination, icon: '🍽️' },
      { id: crypto.randomUUID(), time: '19:00', activity: 'Cena', location: destination, icon: '🍽️' },
    ],
    activities: [],
    meals: {},
    summary: { duration: '10 horas', mainActivities: ['Explorar'] },
    importantNotes: [],
    transport: '',
    overnight: destination,
  }
}

// Regenerate a specific day
async function regenerateDay(
  plan: GeneratedPlan,
  dayNumber: number,
  feedback: string
): Promise<ItineraryDay> {
  const response = await fetch('/api/ai/regenerate-day', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, dayNumber, feedback }),
  })

  if (!response.ok) {
    throw new Error('Failed to regenerate day')
  }

  const data = await response.json()
  const parsed = data.day

  return {
    ...parsed,
    day: dayNumber,
    // Map timeline entries with IDs
    timeline: parsed.timeline?.map((tl: Partial<TimelineEntry>) => ({
      ...tl,
      id: tl.id || crypto.randomUUID(),
    })) || [],
    // Map activities with IDs
    activities: parsed.activities?.map((act: { id?: string }) => ({
      ...act,
      id: act.id || crypto.randomUUID(),
    })) || [],
    // Ensure meals has proper structure
    meals: parsed.meals || {},
    // Ensure summary exists
    summary: parsed.summary || {
      duration: '',
      mainActivities: [],
    },
    // Map important notes with IDs
    importantNotes: parsed.importantNotes?.map((note: Partial<ImportantNote>) => ({
      ...note,
      id: note.id || crypto.randomUUID(),
    })) || [],
  }
}

// Create a minimal valid plan when AI response parsing fails
function createMinimalPlan(
  trip: TripBasics,
  preferences: TravelPreferences,
  totalDays: number
): GeneratedPlan {
  // Generate basic itinerary days
  const itinerary: ItineraryDay[] = []
  const startDate = new Date(trip.startDate)

  for (let i = 0; i < totalDays; i++) {
    const dayDate = new Date(startDate)
    dayDate.setDate(startDate.getDate() + i)

    itinerary.push({
      day: i + 1,
      date: dayDate.toISOString().split('T')[0],
      title: i === 0 ? `Llegada a ${trip.destination}` : i === totalDays - 1 ? 'Día de regreso' : `Día ${i + 1} en ${trip.destination}`,
      timeline: [
        {
          id: crypto.randomUUID(),
          time: '09:00',
          activity: i === 0 ? 'Llegada y check-in' : 'Explorar la zona',
          location: trip.destination,
          icon: i === 0 ? 'plane' : 'walk',
        },
        {
          id: crypto.randomUUID(),
          time: '13:00',
          activity: 'Almuerzo',
          location: trip.destination,
          icon: 'fork',
        },
        {
          id: crypto.randomUUID(),
          time: '19:00',
          activity: 'Cena',
          location: trip.destination,
          icon: 'fork',
        },
      ],
      activities: [],
      meals: {},
      summary: {
        duration: '10 horas',
        mainActivities: ['Explorar', 'Disfrutar'],
      },
      importantNotes: [],
      transport: '',
      overnight: trip.destination,
    })
  }

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    trip,
    preferences,
    summary: {
      title: `Viaje a ${trip.destination}`,
      description: `Plan de viaje de ${totalDays} días a ${trip.destination}. Este es un plan básico que puedes personalizar.`,
      highlights: ['Explora a tu ritmo', 'Descubre lugares locales', 'Disfruta la gastronomía'],
      totalDays,
      totalNights: totalDays - 1,
    },
    itinerary,
    accommodation: {
      type: preferences.accommodationType,
      suggestions: [],
      totalCost: 0,
    },
    // Background sections - will be generated after initial load
    documentsStatus: 'idle',
    packingStatus: 'idle',
    tipsStatus: 'idle',
    warningsStatus: 'idle',
    aiGenerated: {
      provider: 'api',
      generatedAt: new Date().toISOString(),
      regenerations: 0,
    },
  }
}

// ============================================================================
// BACKGROUND GENERATION FUNCTIONS
// These are called after the initial plan is displayed to load secondary data
// ============================================================================

interface TripBasicsForBackground {
  destination: string
  origin: string
  startDate: string
  endDate: string
  travelers: number
}

/**
 * Generate documents list in background
 */
async function generateDocuments(
  trip: TripBasicsForBackground
): Promise<DocumentItem[]> {
  const response = await fetch('/api/ai/generate-documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trip }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate documents')
  }

  const data = await response.json()
  return (data.documents || []).map((doc: Partial<DocumentItem>, idx: number) => ({
    ...doc,
    id: doc.id || `doc-${idx + 1}`,
    checked: false,
  }))
}

/**
 * Generate packing list in background
 */
async function generatePacking(
  trip: TripBasicsForBackground,
  activities: string[]
): Promise<PackingItem[]> {
  const response = await fetch('/api/ai/generate-packing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trip, activities }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate packing list')
  }

  const data = await response.json()
  return (data.packing || []).map((item: Partial<PackingItem>, idx: number) => ({
    ...item,
    id: item.id || `pack-${idx + 1}`,
    checked: false,
  }))
}

/**
 * Generate tips in background
 */
async function generateTips(
  destination: string,
  itinerarySummary: string
): Promise<string[]> {
  const response = await fetch('/api/ai/generate-tips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination, itinerarySummary }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate tips')
  }

  const data = await response.json()
  return data.tips || []
}

/**
 * Generate warnings in background
 */
async function generateWarnings(
  destination: string,
  startDate: string,
  endDate: string
): Promise<string[]> {
  const response = await fetch('/api/ai/generate-warnings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination, startDate, endDate }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate warnings')
  }

  const data = await response.json()
  return data.warnings || []
}

// ============================================================
// NEW: Streaming-based plan generation for improved UX
// ============================================================

interface PlanSummaryResult {
  summary: {
    title: string
    description: string
    highlights: string[]
    totalDays: number
    totalNights: number
    totalDriving?: {
      distance: string
      time: string
    }
  }
  dayTitles: string[]
  accommodation: {
    type: string
    suggestions: AccommodationSuggestion[]
    totalCost: number
  }
  // NEW: Unified accommodations array
  accommodations?: Accommodation[]
  trip: TripBasics
  preferences: TravelPreferences
}

/**
 * Generate only the plan summary (fast, ~10s)
 * Used for immediate redirect while days generate in background
 */
async function generatePlanSummaryOnly(
  options: GeneratePlanOptions
): Promise<PlanSummaryResult> {
  const { trip, preferences } = options
  const totalDays = calculateDays(trip.startDate, trip.endDate)

  const response = await fetch('/api/ai/generate-plan-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trip, preferences }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate plan summary')
  }

  const data = await response.json()
  const summaryParsed = data.summary

  // Process unified accommodations array (new format)
  const accommodations: Accommodation[] = (summaryParsed.accommodations || []).map(
    (acc: Partial<Accommodation>, idx: number) => ({
      id: acc.id || crypto.randomUUID(),
      name: acc.name || 'Hotel',
      type: acc.type || 'hotel',
      area: acc.area || trip.destination,
      checkIn: acc.checkIn || trip.startDate,
      checkOut: acc.checkOut || trip.endDate,
      checkInTime: acc.checkInTime,
      checkOutTime: acc.checkOutTime,
      nights: acc.nights || 1,
      pricePerNight: acc.pricePerNight,
      totalPrice: acc.totalPrice,
      currency: acc.currency || 'USD',
      origin: 'ai_suggestion' as const,
      status: 'suggested' as const,
      whyThisPlace: acc.whyThisPlace,
      amenities: acc.amenities,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  )

  return {
    summary: {
      title: summaryParsed.summary?.title || `Viaje a ${trip.destination}`,
      description: summaryParsed.summary?.description || '',
      highlights: summaryParsed.summary?.highlights || [],
      totalDays,
      totalNights: totalDays - 1,
      totalDriving: summaryParsed.summary?.totalDriving,
    },
    dayTitles: summaryParsed.dayTitles || [],
    accommodation: {
      type: preferences.accommodationType,
      suggestions: summaryParsed.accommodation?.suggestions?.map((acc: { id?: string }, idx: number) => ({
        ...acc,
        id: acc.id || `acc-${idx + 1}`,
      })) || [],
      totalCost: summaryParsed.accommodation?.totalCost || 0,
    },
    // Include unified accommodations array
    accommodations,
    trip,
    preferences,
  }
}

/**
 * Create a partial plan with empty days (for immediate display)
 */
function createPartialPlanFromSummary(
  summaryResult: PlanSummaryResult
): GeneratedPlan {
  const { summary, dayTitles, accommodation, accommodations, trip, preferences } = summaryResult
  const startDate = new Date(trip.startDate)

  // Create placeholder days
  const itinerary: ItineraryDay[] = dayTitles.map((title, idx) => {
    const dayDate = new Date(startDate)
    dayDate.setDate(startDate.getDate() + idx)

    return {
      day: idx + 1,
      date: dayDate.toISOString().split('T')[0],
      title,
      timeline: [], // Empty - will be filled by streaming
      meals: {},
      importantNotes: [],
      transport: '',
      overnight: '',
    }
  })

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    trip,
    preferences,
    summary,
    accommodation: accommodation as GeneratedPlan['accommodation'],
    // Include unified accommodations array (new format)
    accommodations: accommodations || [],
    itinerary,
    documentsStatus: 'idle',
    packingStatus: 'idle',
    tipsStatus: 'idle',
    warningsStatus: 'idle',
    aiGenerated: {
      provider: 'streaming',
      generatedAt: new Date().toISOString(),
      regenerations: 0,
    },
  }
}

interface DayStreamCallbacks {
  onTimelineEntry: (entry: TimelineEntry) => void
  onComplete: (day: ItineraryDay) => void
  onError: (error: string) => void
}

/**
 * Generate a single day using SSE streaming
 * Timeline entries are sent as they're generated
 */
async function generateDayWithStreaming(
  trip: TripBasics,
  preferences: TravelPreferences,
  dayNumber: number,
  dayTitle: string,
  date: string,
  callbacks: DayStreamCallbacks,
  options?: {
    previousDaySummary?: string
    nextDayTitle?: string
    placesContext?: Record<string, unknown> | null
  }
): Promise<void> {
  const response = await fetch('/api/ai/generate-day-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trip,
      preferences,
      dayNumber,
      dayTitle,
      date,
      previousDaySummary: options?.previousDaySummary,
      nextDayTitle: options?.nextDayTitle,
      placesContext: options?.placesContext,
    }),
  })

  if (!response.ok) {
    callbacks.onError('Failed to start day generation')
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    callbacks.onError('No response body')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          // Skip event type lines (we identify data by content)
          continue
        }

        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (!data) continue

          try {
            const parsed = JSON.parse(data)

            // Handle different event types based on content
            if (parsed.id && parsed.time && parsed.activity) {
              // Timeline entry
              callbacks.onTimelineEntry(parsed as TimelineEntry)
            } else if (parsed.day) {
              // Complete day
              callbacks.onComplete(parsed.day as ItineraryDay)
            } else if (parsed.error) {
              callbacks.onError(parsed.error)
            }
          } catch {
            // Ignore malformed data
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Prefetch places for AI context (runs in parallel)
 */
export async function prefetchPlacesForAI(
  destination: string
): Promise<{ placesForAI: Record<string, unknown> | null; fullPlaces: Record<string, unknown> | null }> {
  try {
    const response = await fetch('/api/ai/prefetch-places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination }),
    })

    if (!response.ok) {
      return { placesForAI: null, fullPlaces: null }
    }

    const data = await response.json()
    return {
      placesForAI: data.placesForAI || null,
      fullPlaces: data.fullPlaces || null,
    }
  } catch {
    return { placesForAI: null, fullPlaces: null }
  }
}
