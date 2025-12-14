"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import type {
  TimelineEntry,
  ItineraryDay,
  TravelPreferences,
  GeneratedPlan,
  GenerationSessionState,
  QuickQuestionsResponse,
  StoredSummaryResult,
} from '@/types/plan'
import { createInitialGenerationState } from '@/types/plan'
import {
  generatePlanSummaryOnly,
  createPartialPlanFromSummary,
  generateDayWithStreaming,
  prefetchPlacesForAI,
  type PlanSummaryResult,
} from '@/lib/ai/agent'

export type DayGenerationStatus = 'idle' | 'pending' | 'generating' | 'completed' | 'error'

// ============================================================
// Persistence Functions
// ============================================================

const GENERATION_STATE_KEY = (tripId: string) => `generation-state-${tripId}`
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 2000 // 2 seconds base delay

/**
 * Save generation state to localStorage
 */
export function saveGenerationState(state: GenerationSessionState): void {
  try {
    const stateToSave = {
      ...state,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(GENERATION_STATE_KEY(state.tripId), JSON.stringify(stateToSave))
    console.log('[saveGenerationState] Saved:', state.status, 'currentDay:', state.currentDay)
  } catch (error) {
    console.error('[saveGenerationState] Failed to save:', error)
  }
}

/**
 * Load generation state from localStorage
 */
export function loadGenerationState(tripId: string): GenerationSessionState | null {
  try {
    const stored = localStorage.getItem(GENERATION_STATE_KEY(tripId))
    if (!stored) return null

    const state = JSON.parse(stored) as GenerationSessionState
    console.log('[loadGenerationState] Loaded:', state.status, 'completed:', state.completedDays.length)
    return state
  } catch (error) {
    console.error('[loadGenerationState] Failed to load:', error)
    return null
  }
}

/**
 * Clear generation state from localStorage
 */
export function clearGenerationState(tripId: string): void {
  try {
    localStorage.removeItem(GENERATION_STATE_KEY(tripId))
    console.log('[clearGenerationState] Cleared for trip:', tripId)
  } catch (error) {
    console.error('[clearGenerationState] Failed to clear:', error)
  }
}

/**
 * Delay helper for retry backoff
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export interface DayGenerationState {
  status: DayGenerationStatus
  timeline: TimelineEntry[]
  error?: string
}

interface TripBasics {
  destination: string
  origin: string
  startDate: string
  endDate: string
  travelers: number
}

interface UseDayGenerationOptions {
  tripId: string  // Required for persistence
  onDayComplete?: (dayNumber: number, day: ItineraryDay) => void
  onAllComplete?: (plan: GeneratedPlan) => void
  onError?: (error: string) => void
}

/**
 * Enrich a single day's itinerary with Google Places data
 */
async function enrichDayWithPlaces(
  day: ItineraryDay,
  fullPlaces: Record<string, unknown> | null
): Promise<ItineraryDay> {
  if (!fullPlaces) {
    console.log('[LINKEO DEBUG CLIENT] No hay fullPlaces para enrichment')
    return day
  }

  // DEBUG: Log before enrich
  interface TimelineWithSuggestion extends TimelineEntry {
    suggestedPlaceId?: string
  }
  const suggestedIds = (day.timeline as TimelineWithSuggestion[])
    .filter(t => t.suggestedPlaceId)
    .map(t => ({
      activity: t.activity,
      suggestedPlaceId: t.suggestedPlaceId
    }))

  console.log('[LINKEO DEBUG CLIENT] Día', day.day, '- Antes de enrich:', {
    timelineItems: day.timeline.length,
    withSuggestedId: suggestedIds.length,
    suggestedIds
  })

  try {
    const response = await fetch('/api/ai/enrich-itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itinerary: [day],
        fullPlaces,
      }),
    })

    if (!response.ok) return day

    const data = await response.json()

    // DEBUG: Log after enrich
    const enrichedDay = data.itinerary?.[0]
    if (enrichedDay) {
      console.log('[LINKEO DEBUG CLIENT] Día', day.day, '- Después de enrich:', {
        stats: data.stats,
        linkedActivities: enrichedDay.timeline
          .filter((t: TimelineEntry) => t.placeId)
          .map((t: TimelineEntry) => ({ activity: t.activity, placeId: t.placeId }))
      })
    }

    return enrichedDay || day
  } catch (error) {
    console.warn('[enrichDayWithPlaces] Failed:', error)
    return day
  }
}

export function useDayGeneration(options: UseDayGenerationOptions) {
  const { tripId } = options

  const [plan, setPlan] = useState<GeneratedPlan | null>(null)
  const [dayStates, setDayStates] = useState<Record<number, DayGenerationState>>({})
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Store places context for day generation
  const placesContextRef = useRef<Record<string, unknown> | null>(null)
  const fullPlacesRef = useRef<Record<string, unknown> | null>(null)
  const summaryResultRef = useRef<PlanSummaryResult | null>(null)

  // Persistent generation state
  const generationStateRef = useRef<GenerationSessionState>(createInitialGenerationState(tripId))

  // Active generation tracking
  const activeGenerationsRef = useRef<Set<number>>(new Set())

  // Helper to update and persist generation state
  const updateGenerationState = useCallback((updates: Partial<GenerationSessionState>) => {
    generationStateRef.current = {
      ...generationStateRef.current,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    saveGenerationState(generationStateRef.current)
  }, [])

  /**
   * Hydrate hook state from saved generation state
   * Returns true if hydration was successful and generation should continue
   */
  const hydrateFromSavedState = useCallback((
    savedState: GenerationSessionState,
    existingPlan?: GeneratedPlan | null
  ): boolean => {
    console.log('[hydrateFromSavedState] Hydrating from saved state:', savedState.status)
    console.log('[hydrateFromSavedState] Completed days:', savedState.completedDays)
    console.log('[hydrateFromSavedState] Pending days:', savedState.pendingDays)

    // Restore refs
    if (savedState.summaryResult) {
      summaryResultRef.current = savedState.summaryResult as PlanSummaryResult
      console.log('[hydrateFromSavedState] Restored summaryResult')
    }
    if (savedState.placesContext) {
      placesContextRef.current = savedState.placesContext
      console.log('[hydrateFromSavedState] Restored placesContext')
    }
    if (savedState.fullPlaces) {
      fullPlacesRef.current = savedState.fullPlaces
      console.log('[hydrateFromSavedState] Restored fullPlaces')
    }

    // Update generation state ref
    generationStateRef.current = savedState

    // CRITICAL: Also restore the plan state if provided
    if (existingPlan) {
      console.log('[hydrateFromSavedState] Restoring plan with', existingPlan.itinerary.length, 'days')
      setPlan(existingPlan)
    } else if (savedState.summaryResult) {
      // Reconstruct plan from summary if no existing plan
      console.log('[hydrateFromSavedState] Reconstructing plan from summaryResult')
      const reconstructedPlan = createPartialPlanFromSummary(savedState.summaryResult as PlanSummaryResult)
      setPlan(reconstructedPlan)
    }

    // Initialize day states based on saved state
    const initialStates: Record<number, DayGenerationState> = {}

    // Mark completed days
    savedState.completedDays.forEach(dayNum => {
      initialStates[dayNum] = { status: 'completed', timeline: [] }
    })

    // Mark pending days
    savedState.pendingDays.forEach(dayNum => {
      initialStates[dayNum] = { status: 'pending', timeline: [] }
    })

    // Mark failed days (can be retried)
    savedState.failedDays.forEach(failInfo => {
      if (failInfo.attempts >= MAX_RETRY_ATTEMPTS) {
        initialStates[failInfo.dayNumber] = {
          status: 'error',
          timeline: [],
          error: failInfo.lastError || 'Max retries exceeded',
        }
      } else {
        // Still retryable - mark as pending
        initialStates[failInfo.dayNumber] = { status: 'pending', timeline: [] }
      }
    })

    setDayStates(initialStates)
    setIsHydrated(true)

    console.log('[hydrateFromSavedState] Hydration complete, dayStates:', Object.keys(initialStates).length, 'days')

    // Return true if there's work to continue
    return savedState.status === 'generating' ||
           savedState.status === 'ready_to_generate' ||
           savedState.status === 'paused' ||
           savedState.pendingDays.length > 0
  }, [])

  /**
   * Step 1: Generate summary and create partial plan
   * PROACTIVE PERSISTENCE: Saves state at each critical point
   */
  const generateSummary = useCallback(async (
    trip: TripBasics,
    preferences: TravelPreferences,
    userPreferences?: QuickQuestionsResponse
  ): Promise<GeneratedPlan | null> => {
    setIsGeneratingSummary(true)
    setSummaryError(null)

    // PERSIST: Mark as generating summary BEFORE starting
    updateGenerationState({
      status: 'generating_summary',
      preferences: userPreferences || null,
    })

    try {
      // Start places prefetch in parallel
      const placesPromise = prefetchPlacesForAI(trip.destination)

      // Generate summary
      const summaryResult = await generatePlanSummaryOnly({ trip, preferences })
      summaryResultRef.current = summaryResult

      // PERSIST: Save summaryResult immediately after generation
      updateGenerationState({
        summaryResult: summaryResult as StoredSummaryResult,
      })

      // Create partial plan with empty days
      const partialPlan = createPartialPlanFromSummary(summaryResult)
      setPlan(partialPlan)

      // Initialize day states as pending
      const initialStates: Record<number, DayGenerationState> = {}
      const pendingDays: number[] = []
      partialPlan.itinerary.forEach((day) => {
        initialStates[day.day] = { status: 'pending', timeline: [] }
        pendingDays.push(day.day)
      })
      setDayStates(initialStates)

      // Wait for places (don't block on failure)
      const placesData = await placesPromise
      placesContextRef.current = placesData.placesForAI
      fullPlacesRef.current = placesData.fullPlaces

      // PERSIST: Save places context and mark as ready to generate
      updateGenerationState({
        status: 'ready_to_generate',
        placesContext: placesData.placesForAI,
        fullPlaces: placesData.fullPlaces,
        pendingDays,
        completedDays: [],
        failedDays: [],
      })

      return partialPlan
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate summary'
      setSummaryError(errorMsg)
      options.onError?.(errorMsg)

      // PERSIST: Mark as error
      updateGenerationState({
        status: 'error',
      })

      return null
    } finally {
      setIsGeneratingSummary(false)
    }
  }, [options, updateGenerationState])

  /**
   * Step 2: Start generating a specific day with streaming
   * PROACTIVE PERSISTENCE: Saves state before and after generation
   * RETRY LOGIC: Automatically retries up to MAX_RETRY_ATTEMPTS times
   */
  const startDayGeneration = useCallback(async (dayNumber: number, isRetry: boolean = false) => {
    if (!plan || !summaryResultRef.current) {
      console.error('[useDayGeneration] No plan or summary available')
      return
    }

    // Don't start if already generating
    if (activeGenerationsRef.current.has(dayNumber)) {
      return
    }

    activeGenerationsRef.current.add(dayNumber)

    // Update state to generating
    setDayStates(prev => ({
      ...prev,
      [dayNumber]: { status: 'generating', timeline: [] },
    }))

    // PERSIST: Mark current day BEFORE starting generation
    updateGenerationState({
      status: 'generating',
      currentDay: dayNumber,
    })

    const { trip, preferences, dayTitles } = summaryResultRef.current
    const dayTitle = dayTitles[dayNumber - 1] || `Día ${dayNumber}`
    const startDate = new Date(trip.startDate)
    const dayDate = new Date(startDate)
    dayDate.setDate(startDate.getDate() + (dayNumber - 1))
    const dateStr = dayDate.toISOString().split('T')[0]

    // Get context from previous days if available
    const prevDay = plan.itinerary[dayNumber - 2]
    const previousDaySummary = prevDay?.title || undefined
    const nextDayTitle = dayTitles[dayNumber] || undefined

    // Get current retry info
    const currentState = generationStateRef.current
    const existingFailInfo = currentState.failedDays.find(f => f.dayNumber === dayNumber)
    const currentAttempts = existingFailInfo?.attempts || 0

    try {
      await generateDayWithStreaming(
        trip,
        preferences,
        dayNumber,
        dayTitle,
        dateStr,
        {
          onTimelineEntry: (entry) => {
            setDayStates(prev => ({
              ...prev,
              [dayNumber]: {
                ...prev[dayNumber],
                timeline: [...(prev[dayNumber]?.timeline || []), entry],
              },
            }))
          },
          onComplete: async (day) => {
            // Normalize the day data
            let normalizedDay: ItineraryDay = {
              ...day,
              day: dayNumber,
              date: dateStr,
              title: day.title || dayTitle,
              timeline: day.timeline?.map((tl, idx) => ({
                ...tl,
                id: tl.id || `tl-${dayNumber}-${idx + 1}`,
              })) || [],
              meals: day.meals || {},
              importantNotes: day.importantNotes?.map((note, idx) => ({
                ...note,
                id: note.id || `note-${dayNumber}-${idx + 1}`,
              })) || [],
              transport: day.transport || '',
              overnight: day.overnight || '',
            }

            // Enrich with Google Places data (in background)
            if (fullPlacesRef.current) {
              try {
                const enrichedDay = await enrichDayWithPlaces(normalizedDay, fullPlacesRef.current)
                normalizedDay = enrichedDay
              } catch (e) {
                console.warn('[useDayGeneration] Failed to enrich day:', e)
              }
            }

            // Update day state
            setDayStates(prev => ({
              ...prev,
              [dayNumber]: {
                status: 'completed',
                timeline: normalizedDay.timeline,
              },
            }))

            // Update plan with completed day
            setPlan(prev => {
              if (!prev) return null
              const newItinerary = [...prev.itinerary]
              newItinerary[dayNumber - 1] = normalizedDay
              return { ...prev, itinerary: newItinerary }
            })

            activeGenerationsRef.current.delete(dayNumber)

            // PERSIST: Update completed days and remove from pending/failed
            const newCompletedDays = [...currentState.completedDays, dayNumber]
            const newPendingDays = currentState.pendingDays.filter(d => d !== dayNumber)
            const newFailedDays = currentState.failedDays.filter(f => f.dayNumber !== dayNumber)

            updateGenerationState({
              completedDays: newCompletedDays,
              pendingDays: newPendingDays,
              failedDays: newFailedDays,
              currentDay: null,
              status: newPendingDays.length === 0 ? 'completed' : 'generating',
            })

            options.onDayComplete?.(dayNumber, normalizedDay)

            // Check if all days are complete
            checkAllComplete()
          },
          onError: async (error) => {
            activeGenerationsRef.current.delete(dayNumber)

            const newAttempts = currentAttempts + 1
            console.warn(`[useDayGeneration] Day ${dayNumber} failed (attempt ${newAttempts}/${MAX_RETRY_ATTEMPTS}):`, error)

            // Update failed days info
            const newFailedDays = currentState.failedDays.filter(f => f.dayNumber !== dayNumber)
            newFailedDays.push({
              dayNumber,
              attempts: newAttempts,
              lastError: error,
              lastAttemptAt: new Date().toISOString(),
            })

            // PERSIST: Update failed days
            updateGenerationState({
              failedDays: newFailedDays,
              currentDay: null,
            })

            // RETRY: If under max attempts, retry with exponential backoff
            if (newAttempts < MAX_RETRY_ATTEMPTS) {
              const backoffDelay = RETRY_DELAY_MS * Math.pow(2, newAttempts - 1)
              console.log(`[useDayGeneration] Retrying day ${dayNumber} in ${backoffDelay}ms...`)

              setDayStates(prev => ({
                ...prev,
                [dayNumber]: { status: 'pending', timeline: [], error: `Retrying... (${newAttempts}/${MAX_RETRY_ATTEMPTS})` },
              }))

              await delay(backoffDelay)
              await startDayGeneration(dayNumber, true)
            } else {
              // Max retries exceeded - mark as permanently failed
              console.error(`[useDayGeneration] Day ${dayNumber} failed after ${MAX_RETRY_ATTEMPTS} attempts`)

              setDayStates(prev => ({
                ...prev,
                [dayNumber]: { status: 'error', timeline: [], error },
              }))

              options.onError?.(`Day ${dayNumber} failed after ${MAX_RETRY_ATTEMPTS} attempts: ${error}`)
            }
          },
        },
        {
          previousDaySummary,
          nextDayTitle,
          placesContext: placesContextRef.current,
        }
      )
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      activeGenerationsRef.current.delete(dayNumber)

      const newAttempts = currentAttempts + 1

      // Update failed days
      const newFailedDays = currentState.failedDays.filter(f => f.dayNumber !== dayNumber)
      newFailedDays.push({
        dayNumber,
        attempts: newAttempts,
        lastError: errorMsg,
        lastAttemptAt: new Date().toISOString(),
      })

      updateGenerationState({
        failedDays: newFailedDays,
        currentDay: null,
      })

      // RETRY if under max attempts
      if (newAttempts < MAX_RETRY_ATTEMPTS) {
        const backoffDelay = RETRY_DELAY_MS * Math.pow(2, newAttempts - 1)
        setDayStates(prev => ({
          ...prev,
          [dayNumber]: { status: 'pending', timeline: [], error: `Retrying... (${newAttempts}/${MAX_RETRY_ATTEMPTS})` },
        }))

        await delay(backoffDelay)
        await startDayGeneration(dayNumber, true)
      } else {
        setDayStates(prev => ({
          ...prev,
          [dayNumber]: { status: 'error', timeline: [], error: errorMsg },
        }))
      }
    }
  }, [plan, options, updateGenerationState])

  /**
   * Start generating all days sequentially (one at a time for better UX)
   */
  const startAllDaysGeneration = useCallback(async () => {
    if (!plan) return

    for (const day of plan.itinerary) {
      // Wait for each day to complete before starting next
      await startDayGeneration(day.day)
    }
  }, [plan, startDayGeneration])

  /**
   * Check if all days are complete and trigger callback
   */
  const checkAllComplete = useCallback(() => {
    if (!plan) return

    const allComplete = plan.itinerary.every((day) => {
      const state = dayStates[day.day]
      return state?.status === 'completed'
    })

    if (allComplete) {
      options.onAllComplete?.(plan)
    }
  }, [plan, dayStates, options])

  /**
   * Reset all state and clear persistence
   */
  const reset = useCallback(() => {
    setPlan(null)
    setDayStates({})
    setIsGeneratingSummary(false)
    setSummaryError(null)
    setIsHydrated(false)
    placesContextRef.current = null
    summaryResultRef.current = null
    fullPlacesRef.current = null
    activeGenerationsRef.current.clear()
    generationStateRef.current = createInitialGenerationState(tripId)
    clearGenerationState(tripId)
  }, [tripId])

  /**
   * Regenerate a specific day (for failed days)
   * Resets retry count and starts fresh
   */
  const regenerateDay = useCallback(async (dayNumber: number) => {
    // Check if we have the necessary state to regenerate
    if (!plan || !summaryResultRef.current) {
      console.error('[useDayGeneration] Cannot regenerate: missing plan or summary data')
      console.error('[useDayGeneration] plan:', !!plan, 'summaryResult:', !!summaryResultRef.current)
      options.onError?.('Cannot regenerate day: missing plan context. Try refreshing the page.')
      return
    }

    // Remove from failed days and reset retry count
    const newFailedDays = generationStateRef.current.failedDays.filter(
      f => f.dayNumber !== dayNumber
    )

    updateGenerationState({ failedDays: newFailedDays })

    // Reset day state and start generation
    setDayStates(prev => ({
      ...prev,
      [dayNumber]: { status: 'pending', timeline: [] },
    }))

    // Small delay to ensure state update propagates
    await delay(100)
    await startDayGeneration(dayNumber)
  }, [plan, startDayGeneration, updateGenerationState, options])

  /**
   * Check if we have a saved state that can be resumed
   */
  const canResume = useCallback((): boolean => {
    const saved = loadGenerationState(tripId)
    if (!saved) return false

    return saved.status === 'generating' ||
           saved.status === 'ready_to_generate' ||
           saved.status === 'paused' ||
           saved.pendingDays.length > 0
  }, [tripId])

  return {
    // State
    plan,
    dayStates,
    isGeneratingSummary,
    summaryError,
    isHydrated,

    // Actions
    generateSummary,
    startDayGeneration,
    startAllDaysGeneration,
    reset,
    regenerateDay,
    hydrateFromSavedState,

    // Helpers
    getDayStatus: (dayNumber: number): DayGenerationStatus =>
      dayStates[dayNumber]?.status || 'idle',
    getDayTimeline: (dayNumber: number): TimelineEntry[] =>
      dayStates[dayNumber]?.timeline || [],
    isAnyDayGenerating: Object.values(dayStates).some(s => s.status === 'generating'),
    allDaysComplete: plan?.itinerary.every(d => dayStates[d.day]?.status === 'completed') ?? false,
    canRegenerate: !!plan && !!summaryResultRef.current,
    canResume,
    getGenerationState: () => generationStateRef.current,
  }
}
