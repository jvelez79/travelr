/**
 * Edge Function: generate-itinerary
 * Version: 2025-12-18 - Fix invokeSelf Authorization header
 *
 * Background generation of travel itineraries with chaining pattern.
 * Each invocation handles one step (summary or one day) then self-invokes for the next.
 *
 * Actions:
 * - start: Generate summary + prefetch places, then invoke for day 1
 * - continue: Generate day N, then invoke for day N+1
 * - retry: Retry a failed day
 * - resume: Continue from paused state
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Types
interface GenerationRequest {
  tripId: string
  userId: string
  action: "start" | "continue" | "retry" | "resume"
  dayNumber?: number
  // For start action
  preferences?: QuickQuestionsResponse
  fullPlaces?: Record<string, unknown>  // Places data from client prefetch
}

interface QuickQuestionsResponse {
  priority: string
  interests: string[]
  pace: string
  style: string
  accommodationType: string
}

interface Trip {
  id: string
  destination: string
  origin: string
  start_date: string
  end_date: string
  travelers: number
}

interface GenerationState {
  trip_id: string
  user_id: string
  status: string
  current_day: number | null
  completed_days: number[]
  pending_days: number[]
  failed_days: FailedDay[]
  summary_result: SummaryResult | null
  places_context: Record<string, unknown> | null
  full_places: Record<string, unknown> | null
  preferences: QuickQuestionsResponse | null
  error_message: string | null
  retry_count: number
}

interface FailedDay {
  dayNumber: number
  attempts: number
  lastError?: string
  lastAttemptAt: string
}

interface SummaryResult {
  summary: {
    title: string
    description: string
    highlights: string[]
    totalDays: number
    totalNights: number
    totalDriving?: { distance: string; time: string }
  }
  dayTitles: string[]
  accommodation: {
    type: string
    suggestions: unknown[]
    totalCost: number
  }
}

interface ItineraryDay {
  day: number
  date: string
  title: string
  timeline: TimelineEntry[]
  meals: Record<string, unknown>
  importantNotes: unknown[]
  transport: string
  overnight: string
}

interface TimelineEntry {
  id: string
  time: string
  activity: string
  location?: string
  icon?: string
  duration?: string
  notes?: string
  // Google Places linking
  suggestedPlaceId?: string
  placeId?: string
  placeData?: PlaceData
  matchConfidence?: 'exact' | 'high' | 'low' | 'none'
}

// PlaceData for embedded place information
interface PlaceData {
  id: string
  name: string
  category?: string
  rating?: number
  reviewCount?: number
  priceLevel?: number
  coordinates?: { lat: number; lng: number }
  address?: string
  images?: string[]
  googleMapsUrl?: string
  phone?: string
  website?: string
  openingHours?: string[]
}

// Constants
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
const DEFAULT_MODEL = "claude-sonnet-4-20250514"
const MAX_RETRIES = 3

// ============================================================
// AI Logging - Pricing and Helper Functions
// ============================================================

interface TokenPricing {
  inputPer1M: number
  outputPer1M: number
}

const AI_PRICING: Record<string, TokenPricing> = {
  'claude-sonnet-4-20250514': { inputPer1M: 3.0, outputPer1M: 15.0 },
  'claude-3-5-sonnet-20241022': { inputPer1M: 3.0, outputPer1M: 15.0 },
  'claude-3-opus-20240229': { inputPer1M: 15.0, outputPer1M: 75.0 },
  'claude-3-haiku-20240307': { inputPer1M: 0.25, outputPer1M: 1.25 },
  'claude-haiku-4-5': { inputPer1M: 0.8, outputPer1M: 4.0 },
  'default': { inputPer1M: 3.0, outputPer1M: 15.0 },
}

function calculateCostCents(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = AI_PRICING[model] || AI_PRICING['default']
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M
  return Math.round((inputCost + outputCost) * 100)
}

interface AILogData {
  endpoint: string
  provider: string
  model: string
  tripId: string
  userId?: string
  inputTokens: number
  outputTokens: number
  durationMs: number
  startedAt: Date
  completedAt: Date
  status: 'success' | 'error'
  errorMessage?: string
  metadata?: Record<string, unknown>
}

async function logAIRequestToSupabase(
  supabase: ReturnType<typeof createClient>,
  data: AILogData
): Promise<void> {
  try {
    const costCents = calculateCostCents(data.model, data.inputTokens, data.outputTokens)

    const { error } = await supabase.from('ai_request_logs').insert({
      request_id: crypto.randomUUID(),
      endpoint: data.endpoint,
      provider: data.provider,
      model: data.model,
      user_id: data.userId || null,
      trip_id: data.tripId || null,
      input_tokens: data.inputTokens,
      output_tokens: data.outputTokens,
      cost_cents: costCents,
      duration_ms: data.durationMs,
      started_at: data.startedAt.toISOString(),
      completed_at: data.completedAt.toISOString(),
      status: data.status,
      error_message: data.errorMessage || null,
      metadata: {
        ...data.metadata,
        source: 'edge-function',
      },
    })

    if (error) {
      console.error('[logAIRequestToSupabase] Failed to log:', error)
    }
  } catch (err) {
    console.error('[logAIRequestToSupabase] Error:', err)
  }
}

// Global supabase client for logging (set in main handler)
let globalSupabase: ReturnType<typeof createClient> | null = null
let currentTripId: string | null = null
let currentUserId: string | null = null

// Helper: Calculate days between dates
function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
}

// Main handler
Deno.serve(async (req) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers })
  }

  try {
    const body: GenerationRequest = await req.json()
    const { tripId, userId, action, dayNumber, preferences, fullPlaces } = body

    console.log(`[generate-itinerary] Action: ${action}, Trip: ${tripId}, Day: ${dayNumber || "N/A"}, Places: ${fullPlaces ? Object.keys(fullPlaces).length + ' categories' : 'none'}`)

    // Initialize Supabase client with service role for full access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Set global variables for AI logging
    globalSupabase = supabase
    currentTripId = tripId
    currentUserId = userId

    // Route to appropriate handler
    switch (action) {
      case "start":
        return await handleStart(supabase, tripId, userId, preferences!, fullPlaces)
      case "continue":
        return await handleContinue(supabase, tripId, userId, dayNumber!)
      case "retry":
        return await handleRetry(supabase, tripId, userId, dayNumber!)
      case "resume":
        return await handleResume(supabase, tripId, userId)
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers }
        )
    }
  } catch (error) {
    console.error("[generate-itinerary] Error:", error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

/**
 * Handle start action: Generate summary, prefetch places, initialize state
 */
async function handleStart(
  supabase: ReturnType<typeof createClient>,
  tripId: string,
  userId: string,
  preferences: QuickQuestionsResponse,
  clientFullPlaces?: Record<string, unknown>
): Promise<Response> {
  console.log("[handleStart] Starting generation for trip:", tripId)

  // 1. Load trip data
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single()

  if (tripError || !trip) {
    return errorResponse(`Trip not found: ${tripId}`)
  }

  const totalDays = calculateDays(trip.start_date, trip.end_date)
  const pendingDays = Array.from({ length: totalDays }, (_, i) => i + 1)

  // 2. Initialize generation state
  await supabase.from("generation_states").upsert({
    trip_id: tripId,
    user_id: userId,
    status: "generating_summary",
    current_day: null,
    completed_days: [],
    pending_days: pendingDays,
    failed_days: [],
    preferences,
    error_message: null,
    retry_count: 0,
  }, { onConflict: "trip_id" })

  try {
    // 3. Generate summary
    console.log("[handleStart] Generating summary...")
    const summaryResult = await generateSummary(trip, preferences, totalDays)

    // 4. Use places from client or fallback to empty
    let placesForAI: Record<string, unknown> | null = null
    let fullPlaces: Record<string, unknown> | null = null

    if (clientFullPlaces && Object.keys(clientFullPlaces).length > 0) {
      console.log("[handleStart] Using fullPlaces from client:", Object.keys(clientFullPlaces).length, "categories")
      fullPlaces = clientFullPlaces
      placesForAI = createPlacesForAI(clientFullPlaces)
    } else {
      console.log("[handleStart] No places from client, AI will generate without places context")
    }

    // 5. Create initial plan with empty days
    const initialPlan = createInitialPlan(summaryResult, trip, preferences, totalDays)

    // 6. Save plan to database
    await supabase.from("plans").upsert({
      trip_id: tripId,
      user_id: userId,
      data: initialPlan,
      version: 1,
    }, { onConflict: "trip_id" })

    // 7. Update generation state to ready
    await supabase.from("generation_states").update({
      status: "ready_to_generate",
      summary_result: summaryResult,
      places_context: placesForAI,
      full_places: fullPlaces,
    }).eq("trip_id", tripId)

    console.log("[handleStart] Summary complete, invoking day 1...")

    // 8. Self-invoke to generate day 1
    await invokeSelf(supabase, tripId, userId, "continue", 1)

    return successResponse({ message: "Started generation", totalDays })
  } catch (error) {
    console.error("[handleStart] Error:", error)
    await supabase.from("generation_states").update({
      status: "error",
      error_message: String(error),
    }).eq("trip_id", tripId)

    return errorResponse(String(error))
  }
}

/**
 * Handle continue action: Generate a single day, then invoke next
 */
async function handleContinue(
  supabase: ReturnType<typeof createClient>,
  tripId: string,
  userId: string,
  dayNumber: number
): Promise<Response> {
  console.log("[handleContinue] Generating day:", dayNumber)

  // 1. Load generation state
  const { data: state, error: stateError } = await supabase
    .from("generation_states")
    .select("*")
    .eq("trip_id", tripId)
    .single()

  if (stateError || !state) {
    return errorResponse("Generation state not found")
  }

  // Check if paused
  if (state.status === "paused") {
    console.log("[handleContinue] Generation is paused, stopping")
    return successResponse({ message: "Generation paused" })
  }

  // 2. Load trip
  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single()

  if (!trip) {
    return errorResponse("Trip not found")
  }

  // 3. Load current plan
  const { data: planData, error: planError } = await supabase
    .from("plans")
    .select("data")
    .eq("trip_id", tripId)
    .single()

  if (planError) {
    console.error("[handleContinue] Error loading plan:", planError)
  }

  const plan = planData?.data as { itinerary: ItineraryDay[] } | null
  console.log("[handleContinue] Plan loaded:", plan ? `${plan.itinerary?.length} days` : "NULL")

  // 4. Update state to generating
  await supabase.from("generation_states").update({
    status: "generating",
    current_day: dayNumber,
  }).eq("trip_id", tripId)

  try {
    // 5. Get context for day generation
    const summaryResult = state.summary_result as SummaryResult
    const dayTitle = summaryResult.dayTitles[dayNumber - 1] || `Day ${dayNumber}`
    const startDate = new Date(trip.start_date)
    const dayDate = new Date(startDate)
    dayDate.setDate(startDate.getDate() + (dayNumber - 1))
    const dateStr = dayDate.toISOString().split("T")[0]

    // Previous day context
    const prevDay = plan?.itinerary?.[dayNumber - 2]
    const previousDaySummary = prevDay?.title || undefined

    // Next day title
    const nextDayTitle = summaryResult.dayTitles[dayNumber] || undefined

    // 6. Generate day PROGRESSIVELY (activity by activity with real-time updates)
    console.log("[handleContinue] Starting progressive generation for day", dayNumber)
    await generateDayProgressive(
      supabase,
      tripId,
      trip,
      state.preferences as QuickQuestionsResponse,
      dayNumber,
      dayTitle,
      dateStr,
      state.places_context,
      state.full_places  // Pass full places for enrichment
    )
    console.log("[handleContinue] Day", dayNumber, "generation complete")

    // 9. Update generation state
    const newCompletedDays = [...(state.completed_days || []), dayNumber]
    const newPendingDays = (state.pending_days || []).filter((d: number) => d !== dayNumber)
    const isComplete = newPendingDays.length === 0

    await supabase.from("generation_states").update({
      completed_days: newCompletedDays,
      pending_days: newPendingDays,
      current_day: null,
      status: isComplete ? "completed" : "generating",
      retry_count: 0,
    }).eq("trip_id", tripId)

    console.log(`[handleContinue] Day ${dayNumber} complete.`, isComplete ? "All done!" : `Next: day ${newPendingDays[0]}`)

    // 10. Invoke next day if not complete
    if (!isComplete) {
      await invokeSelf(supabase, tripId, userId, "continue", newPendingDays[0])
    }

    return successResponse({
      message: `Day ${dayNumber} generated`,
      isComplete,
      completedDays: newCompletedDays.length,
      totalDays: newCompletedDays.length + newPendingDays.length,
    })
  } catch (error) {
    console.error(`[handleContinue] Day ${dayNumber} failed:`, error)

    // Update failed days
    const currentRetry = (state.retry_count || 0) + 1
    const failedDays = [...(state.failed_days || [])]
    const existingFail = failedDays.findIndex((f: FailedDay) => f.dayNumber === dayNumber)

    if (existingFail >= 0) {
      failedDays[existingFail] = {
        ...failedDays[existingFail],
        attempts: failedDays[existingFail].attempts + 1,
        lastError: String(error),
        lastAttemptAt: new Date().toISOString(),
      }
    } else {
      failedDays.push({
        dayNumber,
        attempts: 1,
        lastError: String(error),
        lastAttemptAt: new Date().toISOString(),
      })
    }

    // Auto-retry if under limit
    if (currentRetry < MAX_RETRIES) {
      console.log(`[handleContinue] Retrying day ${dayNumber} (attempt ${currentRetry + 1}/${MAX_RETRIES})`)

      await supabase.from("generation_states").update({
        retry_count: currentRetry,
        failed_days: failedDays,
        error_message: String(error),
      }).eq("trip_id", tripId)

      // Exponential backoff
      const delayMs = Math.pow(2, currentRetry) * 1000
      await new Promise(r => setTimeout(r, delayMs))

      await invokeSelf(supabase, tripId, userId, "continue", dayNumber)
    } else {
      // Max retries exceeded, move to next day
      console.log(`[handleContinue] Day ${dayNumber} failed after ${MAX_RETRIES} attempts, moving on`)

      const newPendingDays = (state.pending_days || []).filter((d: number) => d !== dayNumber)
      const isComplete = newPendingDays.length === 0

      await supabase.from("generation_states").update({
        pending_days: newPendingDays,
        failed_days: failedDays,
        current_day: null,
        retry_count: 0,
        status: isComplete ? "completed" : "generating",
        error_message: `Day ${dayNumber} failed: ${error}`,
      }).eq("trip_id", tripId)

      if (!isComplete) {
        await invokeSelf(supabase, tripId, userId, "continue", newPendingDays[0])
      }
    }

    return errorResponse(String(error))
  }
}

/**
 * Handle retry action: Retry a specific failed day
 */
async function handleRetry(
  supabase: ReturnType<typeof createClient>,
  tripId: string,
  userId: string,
  dayNumber: number
): Promise<Response> {
  console.log("[handleRetry] Retrying day:", dayNumber)

  // Reset retry count for this day
  const { data: state } = await supabase
    .from("generation_states")
    .select("failed_days, pending_days")
    .eq("trip_id", tripId)
    .single()

  if (state) {
    const failedDays = (state.failed_days || []).filter((f: FailedDay) => f.dayNumber !== dayNumber)
    const pendingDays = [...(state.pending_days || []), dayNumber].sort((a, b) => a - b)

    await supabase.from("generation_states").update({
      failed_days: failedDays,
      pending_days: pendingDays,
      retry_count: 0,
      status: "generating",
    }).eq("trip_id", tripId)
  }

  // Invoke continue for this day
  await invokeSelf(supabase, tripId, userId, "continue", dayNumber)

  return successResponse({ message: `Retrying day ${dayNumber}` })
}

/**
 * Handle resume action: Continue from paused state
 */
async function handleResume(
  supabase: ReturnType<typeof createClient>,
  tripId: string,
  userId: string
): Promise<Response> {
  console.log("[handleResume] Resuming generation")

  const { data: state } = await supabase
    .from("generation_states")
    .select("pending_days, status")
    .eq("trip_id", tripId)
    .single()

  if (!state) {
    return errorResponse("Generation state not found")
  }

  if (state.status !== "paused") {
    return errorResponse(`Cannot resume: status is ${state.status}`)
  }

  const pendingDays = state.pending_days || []
  if (pendingDays.length === 0) {
    await supabase.from("generation_states").update({
      status: "completed",
    }).eq("trip_id", tripId)
    return successResponse({ message: "No pending days, marking complete" })
  }

  // Update status and invoke next day
  await supabase.from("generation_states").update({
    status: "generating",
  }).eq("trip_id", tripId)

  await invokeSelf(supabase, tripId, userId, "continue", pendingDays[0])

  return successResponse({ message: "Resumed generation" })
}

// ============================================================
// AI Generation Functions
// ============================================================

async function generateSummary(
  trip: Trip,
  preferences: QuickQuestionsResponse,
  totalDays: number
): Promise<SummaryResult> {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")
  if (!anthropicKey) {
    throw new Error("ANTHROPIC_API_KEY not configured")
  }

  const model = Deno.env.get("ANTHROPIC_MODEL") || DEFAULT_MODEL
  const prompt = buildSummaryPrompt(trip, preferences, totalDays)
  const startTime = Date.now()

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  const durationMs = Date.now() - startTime

  if (!response.ok) {
    const error = await response.text()

    // Log failed request
    if (globalSupabase && currentTripId) {
      logAIRequestToSupabase(globalSupabase, {
        endpoint: 'edge-function/generate-summary',
        provider: 'anthropic',
        model,
        tripId: currentTripId,
        userId: currentUserId || undefined,
        inputTokens: 0,
        outputTokens: 0,
        durationMs,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        status: 'error',
        errorMessage: error,
        metadata: { destination: trip.destination, totalDays },
      }).catch(console.error)
    }

    throw new Error(`Anthropic API error: ${error}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  // Log successful request
  if (globalSupabase && currentTripId) {
    logAIRequestToSupabase(globalSupabase, {
      endpoint: 'edge-function/generate-summary',
      provider: 'anthropic',
      model,
      tripId: currentTripId,
      userId: currentUserId || undefined,
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      durationMs,
      startedAt: new Date(startTime),
      completedAt: new Date(),
      status: 'success',
      metadata: { destination: trip.destination, totalDays },
    }).catch(console.error)
  }

  return parseJSON<SummaryResult>(content, "summary")
}

async function generateDay(
  trip: Trip,
  preferences: QuickQuestionsResponse,
  dayNumber: number,
  dayTitle: string,
  date: string,
  placesContext: Record<string, unknown> | null,
  previousDaySummary?: string,
  nextDayTitle?: string
): Promise<ItineraryDay> {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")
  if (!anthropicKey) {
    throw new Error("ANTHROPIC_API_KEY not configured")
  }

  const prompt = buildDayPrompt(
    trip,
    preferences,
    dayNumber,
    dayTitle,
    date,
    placesContext,
    previousDaySummary,
    nextDayTitle
  )

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: Deno.env.get("ANTHROPIC_MODEL") || DEFAULT_MODEL,
      max_tokens: 4000,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error: ${error}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  const parsed = parseJSON<ItineraryDay>(content, "day")
  console.log("[generateDay] Parsed timeline entries:", parsed.timeline?.length || 0)

  // Normalize day data
  return {
    ...parsed,
    day: dayNumber,
    date,
    title: parsed.title || dayTitle,
    timeline: (parsed.timeline || []).map((tl, idx) => ({
      ...tl,
      id: tl.id || `tl-${dayNumber}-${idx + 1}`,
    })),
    meals: parsed.meals || {},
    importantNotes: (parsed.importantNotes || []).map((note, idx) => ({
      ...note,
      id: `note-${dayNumber}-${idx + 1}`,
    })),
    transport: parsed.transport || "",
    overnight: parsed.overnight || "",
  }
}

// ============================================================
// Progressive Day Generation (Activity by Activity)
// ============================================================

interface DayMetadata {
  title: string
  meals: Record<string, unknown>
  transport: string
  overnight: string
  importantNotes: Array<{ type: string; content: string }>
}

interface SingleActivity {
  time: string
  activity: string
  location: string
  icon: string
  duration: string
  notes?: string
  suggestedPlaceId?: string  // Google Place ID suggested by AI
}

// Time slots for a typical day - generates one activity per slot
const TIME_SLOTS = [
  { slot: "morning_early", defaultTime: "09:00", description: "Actividad matutina temprana" },
  { slot: "morning_mid", defaultTime: "10:30", description: "Actividad de media mañana" },
  { slot: "lunch", defaultTime: "13:00", description: "Almuerzo y actividad de mediodía" },
  { slot: "afternoon_early", defaultTime: "15:00", description: "Actividad de primera hora de la tarde" },
  { slot: "afternoon_late", defaultTime: "17:00", description: "Actividad de tarde" },
  { slot: "evening", defaultTime: "19:00", description: "Actividad de atardecer o pre-cena" },
  { slot: "dinner", defaultTime: "20:30", description: "Cena y actividad nocturna" },
  { slot: "night", defaultTime: "22:00", description: "Actividad nocturna opcional" },
]

// ============================================================
// Place Matching & Enrichment Functions
// ============================================================

/**
 * Normalize a place name for comparison
 */
function normalizePlaceName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/^(el |la |los |las |the |a |an |le |les |il |lo |gli |i )/i, "") // Remove articles
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Check if a string is a valid Google Place ID
 */
function isValidGooglePlaceId(id: string): boolean {
  if (!id || typeof id !== "string") return false
  return /^ChIJ[a-zA-Z0-9_-]{20,}$/.test(id)
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function calculateSimilarity(a: string, b: string): number {
  const normA = normalizePlaceName(a)
  const normB = normalizePlaceName(b)
  if (normA === normB) return 1.0
  const maxLen = Math.max(normA.length, normB.length)
  if (maxLen === 0) return 1.0
  const distance = levenshteinDistance(normA, normB)
  return 1 - distance / maxLen
}

/**
 * Extract a potential place name from an activity description
 */
function extractPlaceNameFromActivity(activity: string): string {
  const prefixes = [
    /^visita (a |al |a la |a los |a las )?/i,
    /^explorar /i,
    /^conocer /i,
    /^tour (por |de |en )?/i,
    /^recorrido (por |de |en )?/i,
    /^paseo (por |de |en )?/i,
    /^caminata (por |de |en |hacia )?/i,
    /^almuerzo (en |at )?/i,
    /^cena (en |at )?/i,
    /^desayuno (en |at )?/i,
    /^café (en |at )?/i,
  ]
  let cleaned = activity.trim()
  for (const prefix of prefixes) {
    cleaned = cleaned.replace(prefix, "")
  }
  return cleaned.trim()
}

/**
 * Find the best matching place by name
 */
function findPlaceByName(
  searchName: string,
  places: PlaceData[],
  threshold: number = 0.75
): { place: PlaceData; confidence: number } | null {
  if (!searchName || !places.length) return null

  let bestMatch: PlaceData | null = null
  let bestScore = 0
  const normalizedSearch = normalizePlaceName(searchName)

  for (const place of places) {
    const normalizedPlace = normalizePlaceName(place.name)

    // Exact normalized match
    if (normalizedPlace === normalizedSearch) {
      return { place, confidence: 1.0 }
    }

    // One contains the other
    if (normalizedPlace.includes(normalizedSearch) || normalizedSearch.includes(normalizedPlace)) {
      const containmentScore = Math.min(normalizedPlace.length, normalizedSearch.length) /
        Math.max(normalizedPlace.length, normalizedSearch.length)
      const score = 0.85 + containmentScore * 0.1
      if (score > bestScore) {
        bestScore = score
        bestMatch = place
      }
      continue
    }

    // Fuzzy similarity
    const score = calculateSimilarity(searchName, place.name)
    if (score > bestScore && score >= threshold) {
      bestScore = score
      bestMatch = place
    }
  }

  return bestMatch ? { place: bestMatch, confidence: bestScore } : null
}

/**
 * Find place with fallback strategies
 */
function findPlaceWithFallback(
  suggestedId: string | undefined,
  activityName: string,
  location: string,
  placesMap: Map<string, PlaceData>,
  allPlaces: PlaceData[]
): { place: PlaceData; confidence: 'exact' | 'high' | 'low' } | null {
  // Strategy 1: Exact ID match
  if (suggestedId) {
    const exactMatch = placesMap.get(suggestedId)
    if (exactMatch) {
      return { place: exactMatch, confidence: "exact" }
    }

    // Strategy 2: ID looks like a name (AI mistake)
    if (!isValidGooglePlaceId(suggestedId)) {
      const nameMatch = findPlaceByName(suggestedId, allPlaces, 0.75)
      if (nameMatch) {
        console.log("[LINKEO] Recovered using ID as name:", {
          invalidId: suggestedId,
          matchedPlace: nameMatch.place.name,
          confidence: nameMatch.confidence,
        })
        return {
          place: nameMatch.place,
          confidence: nameMatch.confidence >= 0.9 ? "high" : "low",
        }
      }
    }
  }

  // Strategy 3: Match by activity name
  const cleanedActivity = extractPlaceNameFromActivity(activityName)
  const activityMatch = findPlaceByName(cleanedActivity, allPlaces, 0.8)
  if (activityMatch) {
    console.log("[LINKEO] Matched by activity name:", {
      activityName,
      cleanedActivity,
      matchedPlace: activityMatch.place.name,
      confidence: activityMatch.confidence,
    })
    return {
      place: activityMatch.place,
      confidence: activityMatch.confidence >= 0.9 ? "high" : "low",
    }
  }

  // Strategy 4: Match by location
  if (location) {
    const locationMatch = findPlaceByName(location, allPlaces, 0.8)
    if (locationMatch) {
      console.log("[LINKEO] Matched by location:", {
        location,
        matchedPlace: locationMatch.place.name,
        confidence: locationMatch.confidence,
      })
      return {
        place: locationMatch.place,
        confidence: locationMatch.confidence >= 0.9 ? "high" : "low",
      }
    }
  }

  return null
}

/**
 * Convert raw place data to PlaceData interface
 */
function convertToPlaceData(p: Record<string, unknown>): PlaceData {
  const location = p.location as Record<string, unknown> | undefined
  return {
    id: p.id as string,
    name: p.name as string,
    category: (p.category || p.type) as string | undefined,
    rating: p.rating as number | undefined,
    reviewCount: p.reviewCount as number | undefined,
    priceLevel: p.priceLevel as number | undefined,
    coordinates: location ? {
      lat: location.lat as number,
      lng: location.lng as number,
    } : undefined,
    address: (location?.address || p.address) as string | undefined,
    images: (p.images as string[] | undefined)?.slice(0, 2),
    googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.id}`,
    openingHours: p.openingHours as string[] | undefined,
  }
}

/**
 * Build places map from full places data
 */
function buildPlacesMapAndArray(fullPlaces: Record<string, unknown> | null): {
  placesMap: Map<string, PlaceData>
  allPlaces: PlaceData[]
} {
  const placesMap = new Map<string, PlaceData>()
  const allPlaces: PlaceData[] = []

  if (!fullPlaces) {
    return { placesMap, allPlaces }
  }

  for (const [_category, places] of Object.entries(fullPlaces)) {
    if (Array.isArray(places)) {
      for (const p of places) {
        const placeData = convertToPlaceData(p as Record<string, unknown>)
        if (placeData.id && !placesMap.has(placeData.id)) {
          placesMap.set(placeData.id, placeData)
          allPlaces.push(placeData)
        }
      }
    }
  }

  console.log("[LINKEO] Built places map:", {
    totalPlaces: allPlaces.length,
    categories: Object.keys(fullPlaces).length,
  })

  return { placesMap, allPlaces }
}

/**
 * Enrich an activity with place data
 */
function enrichActivityWithPlace(
  activity: SingleActivity,
  placesMap: Map<string, PlaceData>,
  allPlaces: PlaceData[]
): {
  placeId?: string
  placeData?: PlaceData
  matchConfidence: 'exact' | 'high' | 'low' | 'none'
} {
  if (allPlaces.length === 0) {
    return { matchConfidence: 'none' }
  }

  const match = findPlaceWithFallback(
    activity.suggestedPlaceId,
    activity.activity,
    activity.location,
    placesMap,
    allPlaces
  )

  if (match) {
    return {
      placeId: match.place.id,
      placeData: match.place,
      matchConfidence: match.confidence
    }
  }

  return { matchConfidence: 'none' }
}

function buildMetadataPrompt(
  trip: Trip,
  preferences: QuickQuestionsResponse,
  dayNumber: number,
  dayTitle: string,
  date: string
): string {
  return `Genera los metadatos para el día ${dayNumber} del viaje en JSON:
- Destino: ${trip.destination}
- Fecha: ${date}
- Título sugerido: ${dayTitle}
- Viajeros: ${trip.travelers}
- Prioridad: ${preferences.priority}
- Intereses: ${preferences.interests?.join(", ") || "general"}
- Ritmo: ${preferences.pace}
- Estilo: ${preferences.style}

Responde SOLO con este JSON (sin timeline, solo metadatos):
{
  "title": "Título descriptivo del día",
  "meals": {
    "breakfast": { "name": "Nombre del restaurante/café", "cuisine": "Tipo de cocina" },
    "lunch": { "name": "Nombre del restaurante", "cuisine": "Tipo de cocina" },
    "dinner": { "name": "Nombre del restaurante", "cuisine": "Tipo de cocina" }
  },
  "transport": "Medio de transporte principal del día (ej: Metro y a pie, Coche alquilado)",
  "overnight": "Nombre y zona del alojamiento para esta noche",
  "importantNotes": [
    { "type": "tip", "content": "Consejo útil específico para este día" },
    { "type": "warning", "content": "Advertencia si aplica" }
  ]
}`
}

function buildActivityPrompt(
  trip: Trip,
  preferences: QuickQuestionsResponse,
  dayNumber: number,
  dayTitle: string,
  date: string,
  slotIndex: number,
  timeSlot: typeof TIME_SLOTS[0],
  previousActivities: SingleActivity[],
  placesContext: Record<string, unknown> | null
): string {
  // Build places info with clear instructions for linking
  const placesInfo = placesContext
    ? `
LUGARES DISPONIBLES (DEBES elegir de esta lista cuando sea posible):
${JSON.stringify(placesContext, null, 2)}

INSTRUCCIÓN CRÍTICA: Cuando la actividad corresponda a un lugar de la lista anterior, DEBES incluir su "id" exacto en el campo "suggestedPlaceId". Los IDs comienzan con "ChIJ" (ej: "ChIJN1t_tDeuEmsRUsoyG83frY4").`
    : ""

  const previousContext = previousActivities.length > 0
    ? `\nActividades ya planificadas para hoy:\n${previousActivities.map(a => `- ${a.time}: ${a.activity} en ${a.location}`).join("\n")}`
    : ""

  return `Genera UNA actividad para el slot "${timeSlot.description}" del día ${dayNumber}:
- Destino: ${trip.destination}
- Fecha: ${date}
- Día: ${dayTitle}
- Viajeros: ${trip.travelers}
- Prioridad: ${preferences.priority}
- Intereses: ${preferences.interests?.join(", ") || "general"}
- Ritmo: ${preferences.pace}
- Estilo: ${preferences.style}
${previousContext}
${placesInfo}

IMPORTANTE: Genera UNA SOLA actividad que sea apropiada para el horario (aproximadamente ${timeSlot.defaultTime}).
La actividad debe ser coherente con las anteriores y no repetirse.

Responde SOLO con este JSON:
{
  "time": "${timeSlot.defaultTime}",
  "activity": "Nombre específico de la actividad",
  "location": "Lugar específico donde se realiza",
  "icon": "emoji representativo",
  "duration": "Duración estimada (ej: 1.5 horas)",
  "notes": "Notas útiles opcionales",
  "suggestedPlaceId": "ID del lugar de la lista si aplica (ej: ChIJ...), o null si no corresponde"
}`
}

async function generateDayMetadata(
  trip: Trip,
  preferences: QuickQuestionsResponse,
  dayNumber: number,
  dayTitle: string,
  date: string
): Promise<DayMetadata> {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")
  if (!anthropicKey) {
    throw new Error("ANTHROPIC_API_KEY not configured")
  }

  const model = Deno.env.get("ANTHROPIC_MODEL") || DEFAULT_MODEL
  const prompt = buildMetadataPrompt(trip, preferences, dayNumber, dayTitle, date)
  const startTime = Date.now()

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  const durationMs = Date.now() - startTime

  if (!response.ok) {
    const error = await response.text()

    // Log failed request
    if (globalSupabase && currentTripId) {
      logAIRequestToSupabase(globalSupabase, {
        endpoint: 'edge-function/generate-day-metadata',
        provider: 'anthropic',
        model,
        tripId: currentTripId,
        userId: currentUserId || undefined,
        inputTokens: 0,
        outputTokens: 0,
        durationMs,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        status: 'error',
        errorMessage: error,
        metadata: { dayNumber, destination: trip.destination },
      }).catch(console.error)
    }

    throw new Error(`Anthropic API error (metadata): ${error}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  // Log successful request
  if (globalSupabase && currentTripId) {
    logAIRequestToSupabase(globalSupabase, {
      endpoint: 'edge-function/generate-day-metadata',
      provider: 'anthropic',
      model,
      tripId: currentTripId,
      userId: currentUserId || undefined,
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      durationMs,
      startedAt: new Date(startTime),
      completedAt: new Date(),
      status: 'success',
      metadata: { dayNumber, destination: trip.destination },
    }).catch(console.error)
  }

  return parseJSON<DayMetadata>(content, "metadata")
}

async function generateSingleActivity(
  trip: Trip,
  preferences: QuickQuestionsResponse,
  dayNumber: number,
  dayTitle: string,
  date: string,
  slotIndex: number,
  timeSlot: typeof TIME_SLOTS[0],
  previousActivities: SingleActivity[],
  placesContext: Record<string, unknown> | null
): Promise<SingleActivity> {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")
  if (!anthropicKey) {
    throw new Error("ANTHROPIC_API_KEY not configured")
  }

  const model = Deno.env.get("ANTHROPIC_MODEL") || DEFAULT_MODEL
  const prompt = buildActivityPrompt(
    trip,
    preferences,
    dayNumber,
    dayTitle,
    date,
    slotIndex,
    timeSlot,
    previousActivities,
    placesContext
  )
  const startTime = Date.now()

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  const durationMs = Date.now() - startTime

  if (!response.ok) {
    const error = await response.text()

    // Log failed request
    if (globalSupabase && currentTripId) {
      logAIRequestToSupabase(globalSupabase, {
        endpoint: 'edge-function/generate-activity',
        provider: 'anthropic',
        model,
        tripId: currentTripId,
        userId: currentUserId || undefined,
        inputTokens: 0,
        outputTokens: 0,
        durationMs,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        status: 'error',
        errorMessage: error,
        metadata: { dayNumber, slotIndex, timeSlot: timeSlot.slot, destination: trip.destination },
      }).catch(console.error)
    }

    throw new Error(`Anthropic API error (activity): ${error}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  // Log successful request
  if (globalSupabase && currentTripId) {
    logAIRequestToSupabase(globalSupabase, {
      endpoint: 'edge-function/generate-activity',
      provider: 'anthropic',
      model,
      tripId: currentTripId,
      userId: currentUserId || undefined,
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      durationMs,
      startedAt: new Date(startTime),
      completedAt: new Date(),
      status: 'success',
      metadata: { dayNumber, slotIndex, timeSlot: timeSlot.slot, destination: trip.destination },
    }).catch(console.error)
  }

  return parseJSON<SingleActivity>(content, "activity")
}

async function generateDayProgressive(
  supabase: ReturnType<typeof createClient>,
  tripId: string,
  trip: Trip,
  preferences: QuickQuestionsResponse,
  dayNumber: number,
  dayTitle: string,
  date: string,
  placesContext: Record<string, unknown> | null,
  fullPlaces: Record<string, unknown> | null  // Added for enrichment
): Promise<void> {
  console.log(`[generateDayProgressive] Starting day ${dayNumber}: ${dayTitle}`)

  // Step 1: Build places map for enrichment (do this once per day)
  const { placesMap, allPlaces } = buildPlacesMapAndArray(fullPlaces)
  console.log(`[generateDayProgressive] Places map built: ${allPlaces.length} places available for linking`)

  // Metrics tracking
  let linkedCount = 0
  let unlinkedCount = 0

  // Step 2: Generate and save day metadata first
  console.log(`[generateDayProgressive] Generating metadata for day ${dayNumber}`)
  const metadata = await generateDayMetadata(trip, preferences, dayNumber, dayTitle, date)

  // Save metadata immediately (UI sees structure appear)
  const { error: metadataError } = await supabase.rpc('update_day_metadata', {
    p_trip_id: tripId,
    p_day_index: dayNumber - 1,
    p_title: metadata.title || dayTitle,
    p_meals: metadata.meals || {},
    p_transport: metadata.transport || "",
    p_overnight: metadata.overnight || "",
    p_important_notes: metadata.importantNotes || []
  })

  if (metadataError) {
    console.error(`[generateDayProgressive] Error saving metadata:`, metadataError)
    throw new Error(`Failed to save day ${dayNumber} metadata: ${metadataError.message}`)
  }
  console.log(`[generateDayProgressive] Metadata saved for day ${dayNumber}`)

  // Step 3: Generate activities one by one
  const generatedActivities: SingleActivity[] = []

  // Determine number of activities based on pace
  const activityCount = preferences.pace === "relaxed" ? 5
    : preferences.pace === "intensive" ? 8
    : 6 // moderate

  const slotsToUse = TIME_SLOTS.slice(0, activityCount)

  for (let i = 0; i < slotsToUse.length; i++) {
    const timeSlot = slotsToUse[i]
    console.log(`[generateDayProgressive] Day ${dayNumber}, activity ${i + 1}/${slotsToUse.length}: ${timeSlot.description}`)

    try {
      const activity = await generateSingleActivity(
        trip,
        preferences,
        dayNumber,
        dayTitle,
        date,
        i,
        timeSlot,
        generatedActivities,
        placesContext
      )

      // ENRICHMENT: Link activity to Google Places
      const enrichment = enrichActivityWithPlace(activity, placesMap, allPlaces)

      // Track metrics
      if (enrichment.placeId) {
        linkedCount++
        console.log(`[LINKEO] Activity "${activity.activity}" linked to "${enrichment.placeData?.name}" (${enrichment.matchConfidence})`)
      } else {
        unlinkedCount++
        console.log(`[LINKEO] Activity "${activity.activity}" - no match found`)
      }

      // Create timeline entry with proper ID and enriched data
      const timelineEntry: TimelineEntry = {
        id: `tl-${dayNumber}-${i + 1}`,
        time: activity.time || timeSlot.defaultTime,
        activity: activity.activity,
        location: activity.location || "",
        icon: activity.icon || "📍",
        duration: activity.duration || "1 hora",
        notes: activity.notes || "",
        // Google Places linking
        suggestedPlaceId: activity.suggestedPlaceId,
        placeId: enrichment.placeId,
        placeData: enrichment.placeData,
        matchConfidence: enrichment.matchConfidence
      }

      // Append to database immediately (UI sees activity appear)
      const { error: appendError } = await supabase.rpc('append_activity_to_day', {
        p_trip_id: tripId,
        p_day_index: dayNumber - 1,
        p_activity: timelineEntry
      })

      if (appendError) {
        console.error(`[generateDayProgressive] Error appending activity ${i + 1}:`, appendError)
        // Continue with other activities even if one fails
      } else {
        console.log(`[generateDayProgressive] Activity ${i + 1} appended: ${activity.activity}`)
      }

      generatedActivities.push(activity)

    } catch (err) {
      console.error(`[generateDayProgressive] Error generating activity ${i + 1}:`, err)
      // Continue with other activities
    }
  }

  // Log day summary with linkeo metrics
  const linkRate = generatedActivities.length > 0
    ? Math.round((linkedCount / generatedActivities.length) * 100)
    : 0
  console.log(`[generateDayProgressive] Day ${dayNumber} complete:`, {
    activities: generatedActivities.length,
    linked: linkedCount,
    unlinked: unlinkedCount,
    linkRate: `${linkRate}%`
  })
}

/**
 * Create a simplified version of places for AI prompts
 * Limits to 25 places per category with only essential fields
 */
function createPlacesForAI(fullPlaces: Record<string, unknown>): Record<string, unknown> {
  const simplified: Record<string, unknown[]> = {}

  for (const [category, places] of Object.entries(fullPlaces)) {
    if (Array.isArray(places)) {
      simplified[category] = places.slice(0, 25).map((p: Record<string, unknown>) => ({
        id: p.id,
        name: p.name,
        rating: p.rating,
        priceLevel: p.priceLevel,
        address: (p.location as Record<string, unknown>)?.address || p.address,
      }))
    }
  }

  console.log("[createPlacesForAI] Created simplified places:",
    Object.entries(simplified).map(([k, v]) => `${k}: ${v.length}`).join(", "))

  return simplified
}

// Legacy function - places are now passed from client
async function prefetchPlaces(
  destination: string
): Promise<{ placesForAI: Record<string, unknown> | null; fullPlaces: Record<string, unknown> | null }> {
  console.log("[prefetchPlaces] DEPRECATED: Places should come from client")
  return { placesForAI: null, fullPlaces: null }
}

async function enrichDayWithPlaces(
  day: ItineraryDay,
  fullPlaces: Record<string, unknown>
): Promise<ItineraryDay> {
  // For now, return day as-is - enrichment would need matching logic
  console.log("[enrichDayWithPlaces] Skipping enrichment (TODO: implement)")
  return day
}

// ============================================================
// Helper Functions
// ============================================================

async function invokeSelf(
  _supabase: ReturnType<typeof createClient>,
  tripId: string,
  userId: string,
  action: string,
  dayNumber?: number
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  // Use custom SERVICE_ROLE_KEY (correctly configured) with fallback to default
  const serviceKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

  // Use fetch with explicit Authorization header
  // supabase.functions.invoke() doesn't pass the service key correctly in production
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/generate-itinerary`

  const response = await fetch(edgeFunctionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ tripId, userId, action, dayNumber }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[invokeSelf] Failed to invoke:", response.status, errorText)
    throw new Error(`Failed to invoke self: ${response.status} ${errorText}`)
  }
}

function createInitialPlan(
  summaryResult: SummaryResult,
  trip: Trip,
  preferences: QuickQuestionsResponse,
  totalDays: number
) {
  const startDate = new Date(trip.start_date)

  const itinerary: ItineraryDay[] = summaryResult.dayTitles.map((title, idx) => {
    const dayDate = new Date(startDate)
    dayDate.setDate(startDate.getDate() + idx)

    return {
      day: idx + 1,
      date: dayDate.toISOString().split("T")[0],
      title,
      timeline: [],
      meals: {},
      importantNotes: [],
      transport: "",
      overnight: "",
    }
  })

  // Normalize and validate accommodation suggestions
  const accommodationSuggestions = (summaryResult.accommodation?.suggestions || []).map(
    (acc: Record<string, unknown>, idx: number) => ({
      id: acc.id || `acc-${idx + 1}`,
      name: acc.name || "Hotel por definir",
      type: acc.type || preferences.accommodationType,
      area: acc.area || "",
      pricePerNight: acc.pricePerNight || 0,
      why: acc.why || "",
      nights: acc.nights || 1,
      checkIn: acc.checkIn || trip.start_date,
      checkOut: acc.checkOut || trip.end_date,
      checkInTime: acc.checkInTime || "3:00 PM",
      checkOutTime: acc.checkOutTime || "11:00 AM",
      amenities: acc.amenities || [],
      location: acc.location,
    })
  )

  console.log("[createInitialPlan] Accommodation suggestions:", accommodationSuggestions.length)
  accommodationSuggestions.forEach((acc: Record<string, unknown>) => {
    console.log(`  - ${acc.name}: ${acc.checkIn} to ${acc.checkOut} (${acc.nights} nights)`)
  })

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    trip: {
      destination: trip.destination,
      origin: trip.origin,
      startDate: trip.start_date,
      endDate: trip.end_date,
      travelers: trip.travelers,
    },
    preferences,
    summary: summaryResult.summary,
    // Unified accommodations array (new format)
    accommodations: accommodationSuggestions.map((s: Record<string, unknown>) => ({
      id: s.id || crypto.randomUUID(),
      name: s.name,
      type: s.type,
      area: s.area,
      checkIn: s.checkIn,
      checkOut: s.checkOut,
      checkInTime: s.checkInTime,
      checkOutTime: s.checkOutTime,
      nights: s.nights,
      pricePerNight: s.pricePerNight,
      currency: "USD",
      origin: "ai_suggestion" as const,
      status: "suggested" as const,
      whyThisPlace: s.why,
      amenities: s.amenities,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    itinerary,
    documentsStatus: "idle",
    packingStatus: "idle",
    tipsStatus: "idle",
    warningsStatus: "idle",
    aiGenerated: {
      provider: "edge-function",
      generatedAt: new Date().toISOString(),
      regenerations: 0,
    },
  }
}

function parseJSON<T>(content: string, context: string): T {
  let jsonStr = content.trim()

  // Remove markdown code blocks
  if (jsonStr.startsWith("```")) {
    const firstNewline = jsonStr.indexOf("\n")
    const lastBackticks = jsonStr.lastIndexOf("```")
    jsonStr = jsonStr.substring(firstNewline + 1, lastBackticks).trim()
  }

  // Find JSON object
  const jsonStart = jsonStr.indexOf("{")
  const jsonEnd = jsonStr.lastIndexOf("}")
  if (jsonStart !== -1 && jsonEnd !== -1) {
    jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1)
  }

  try {
    return JSON.parse(jsonStr)
  } catch (error) {
    console.error(`[parseJSON] Failed to parse ${context}:`, error)
    throw new Error(`Failed to parse AI response for ${context}`)
  }
}

function successResponse(data: Record<string, unknown>): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

function errorResponse(message: string, status = 500): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

// ============================================================
// Prompts (simplified versions for Edge Function)
// ============================================================

const SYSTEM_PROMPT = `Eres un experto planificador de viajes. Generas itinerarios detallados en formato JSON.
IMPORTANTE: Responde SOLO con JSON válido, sin texto adicional ni explicaciones.`

function buildSummaryPrompt(
  trip: Trip,
  preferences: QuickQuestionsResponse,
  totalDays: number
): string {
  const totalNights = totalDays - 1

  return `Genera un resumen de viaje en JSON para:
- Destino: ${trip.destination}
- Origen: ${trip.origin}
- Fecha inicio: ${trip.start_date}
- Fecha fin: ${trip.end_date}
- Total días: ${totalDays}
- Total noches: ${totalNights}
- Viajeros: ${trip.travelers}
- Prioridad: ${preferences.priority}
- Intereses: ${preferences.interests?.join(", ") || "general"}
- Ritmo: ${preferences.pace}
- Estilo: ${preferences.style}
- Tipo alojamiento preferido: ${preferences.accommodationType}

IMPORTANTE SOBRE ALOJAMIENTO:
- Genera sugerencias de alojamiento que cubran TODAS las ${totalNights} noches del viaje
- Si el viaje incluye múltiples zonas/regiones, divide el alojamiento estratégicamente
- Cada sugerencia debe tener checkIn (fecha llegada) y checkOut (fecha salida) en formato YYYY-MM-DD
- La primera noche es ${trip.start_date}, la última noche es el día antes de ${trip.end_date}
- Los checkIn/checkOut deben ser consecutivos sin huecos

Responde con este JSON exacto:
{
  "summary": {
    "title": "Título atractivo del viaje",
    "description": "Descripción breve del viaje (2-3 oraciones)",
    "highlights": ["highlight1", "highlight2", "highlight3", "highlight4", "highlight5"],
    "totalDays": ${totalDays},
    "totalNights": ${totalNights},
    "totalDriving": { "distance": "X km aproximados", "time": "X horas total" }
  },
  "dayTitles": ["Título descriptivo día 1", "Título descriptivo día 2", "...uno por cada día"],
  "accommodation": {
    "type": "${preferences.accommodationType}",
    "suggestions": [
      {
        "id": "acc-1",
        "name": "Nombre del hotel/alojamiento",
        "type": "${preferences.accommodationType}",
        "area": "Zona/barrio/región",
        "pricePerNight": 80,
        "why": "Por qué este alojamiento es ideal para esta parte del viaje",
        "nights": 3,
        "checkIn": "YYYY-MM-DD",
        "checkOut": "YYYY-MM-DD",
        "checkInTime": "3:00 PM",
        "checkOutTime": "11:00 AM",
        "amenities": ["WiFi", "Parking", "Pool", "etc"]
      }
    ],
    "totalCost": 0
  }
}

NOTAS:
- dayTitles debe tener exactamente ${totalDays} títulos (uno por día)
- suggestions debe cubrir las ${totalNights} noches completas
- Si el destino tiene múltiples zonas interesantes, sugiere 2-3 alojamientos en diferentes áreas
- Asegúrate que los checkOut de un alojamiento coincidan con el checkIn del siguiente`
}

function buildDayPrompt(
  trip: Trip,
  preferences: QuickQuestionsResponse,
  dayNumber: number,
  dayTitle: string,
  date: string,
  placesContext: Record<string, unknown> | null,
  previousDaySummary?: string,
  nextDayTitle?: string
): string {
  const placesInfo = placesContext
    ? `\nLugares disponibles:\n${JSON.stringify(placesContext, null, 2)}`
    : ""

  return `Genera el itinerario del día ${dayNumber} en JSON:
- Destino: ${trip.destination}
- Fecha: ${date}
- Título sugerido: ${dayTitle}
- Viajeros: ${trip.travelers}
- Prioridad: ${preferences.priority}
- Intereses: ${preferences.interests?.join(", ") || "general"}
- Ritmo: ${preferences.pace}
- Estilo: ${preferences.style}
${previousDaySummary ? `- Día anterior: ${previousDaySummary}` : ""}
${nextDayTitle ? `- Siguiente día: ${nextDayTitle}` : ""}
${placesInfo}

Responde con este JSON exacto:
{
  "day": ${dayNumber},
  "date": "${date}",
  "title": "${dayTitle}",
  "timeline": [
    {
      "id": "tl-${dayNumber}-1",
      "time": "09:00",
      "activity": "Nombre de actividad",
      "location": "Lugar específico",
      "icon": "emoji",
      "duration": "2 horas",
      "notes": "Notas opcionales"
    }
  ],
  "meals": {
    "breakfast": { "name": "Restaurante", "cuisine": "Tipo" },
    "lunch": { "name": "Restaurante", "cuisine": "Tipo" },
    "dinner": { "name": "Restaurante", "cuisine": "Tipo" }
  },
  "importantNotes": [
    { "type": "tip", "content": "Consejo útil" }
  ],
  "transport": "Medio de transporte del día",
  "overnight": "Lugar donde pernoctar"
}`
}
