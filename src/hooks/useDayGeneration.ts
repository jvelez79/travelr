"use client"

/**
 * useDayGeneration - Backward-compatible wrapper over useBackgroundGeneration
 *
 * This hook maintains the same public API as the original client-side implementation
 * but now delegates to server-side background generation via Edge Functions.
 *
 * Key changes:
 * - Generation happens server-side (survives browser close)
 * - State updates come via Supabase Realtime
 * - localStorage is no longer used for generation state
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import type {
  TimelineEntry,
  ItineraryDay,
  TravelPreferences,
  GeneratedPlan,
  GenerationSessionState,
  QuickQuestionsResponse,
} from '@/types/plan'
import { useBackgroundGeneration } from './useBackgroundGeneration'
import { prefetchPlacesForAI } from '@/lib/ai/agent'

// ============================================================
// Types (exported for backward compatibility)
// ============================================================

export type DayGenerationStatus = 'idle' | 'pending' | 'generating' | 'completed' | 'error'

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
  tripId: string
  userId?: string | null
  onDayComplete?: (dayNumber: number, day: ItineraryDay) => void
  onAllComplete?: (plan: GeneratedPlan) => void
  onError?: (error: string) => void
}

// ============================================================
// Deprecated localStorage functions (kept for migration)
// ============================================================

const GENERATION_STATE_KEY = (tripId: string) => `generation-state-${tripId}`

/** @deprecated Use Supabase state instead */
function saveGenerationState(state: GenerationSessionState): void {
  console.warn('[useDayGeneration] saveGenerationState is deprecated - state is now managed server-side')
}

/** @deprecated Use Supabase state instead */
export function loadGenerationState(tripId: string): GenerationSessionState | null {
  try {
    const stored = localStorage.getItem(GENERATION_STATE_KEY(tripId))
    if (!stored) return null
    return JSON.parse(stored) as GenerationSessionState
  } catch {
    return null
  }
}

/** @deprecated Use Supabase state instead */
function clearGenerationState(tripId: string): void {
  try {
    localStorage.removeItem(GENERATION_STATE_KEY(tripId))
  } catch {
    // Ignore
  }
}

/** @deprecated */
async function syncGenerationStateToSupabase(): Promise<boolean> {
  console.warn('[useDayGeneration] syncGenerationStateToSupabase is deprecated')
  return true
}

/** @deprecated */
async function loadGenerationStateFromSupabase(): Promise<GenerationSessionState | null> {
  console.warn('[useDayGeneration] loadGenerationStateFromSupabase is deprecated')
  return null
}

/** @deprecated */
async function clearGenerationStateEverywhere(tripId: string): Promise<void> {
  clearGenerationState(tripId)
}

// ============================================================
// Main Hook
// ============================================================

export function useDayGeneration(options: UseDayGenerationOptions) {
  const { tripId, onDayComplete, onAllComplete, onError } = options

  // Track summary generation state locally (for UI compatibility)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Store full places for enrichment (passed to Edge Function)
  const [fullPlaces, setFullPlaces] = useState<Record<string, unknown> | null>(null)

  // Use the new background generation hook
  const {
    state: bgState,
    plan,
    loading,
    error: bgError,
    isGenerating,
    isCompleted,
    hasError,
    canResume: bgCanResume,
    canRetry,
    progress,
    startGeneration,
    pauseGeneration,
    resumeGeneration,
    retryFailedDays,
    refetch,
  } = useBackgroundGeneration({
    tripId,
    onDayComplete: (dayNumber) => {
      // Find the completed day in the plan and call callback
      if (plan && onDayComplete) {
        const day = plan.itinerary.find(d => d.day === dayNumber)
        if (day) {
          onDayComplete(dayNumber, day)
        }
      }
    },
    onAllComplete: () => {
      if (plan && onAllComplete) {
        onAllComplete(plan)
      }
    },
    onError,
  })

  // Mark as hydrated once initial load completes
  useEffect(() => {
    if (!loading && !isHydrated) {
      setIsHydrated(true)
    }
  }, [loading, isHydrated])

  // ============================================================
  // Computed dayStates from background state
  // ============================================================

  const dayStates = useMemo((): Record<number, DayGenerationState> => {
    if (!plan || !bgState) return {}

    const states: Record<number, DayGenerationState> = {}

    plan.itinerary.forEach((day) => {
      const dayNum = day.day

      if (bgState.completedDays.includes(dayNum)) {
        states[dayNum] = {
          status: 'completed',
          timeline: day.timeline || [],
        }
      } else if (bgState.currentDay === dayNum) {
        states[dayNum] = {
          status: 'generating',
          timeline: day.timeline || [],
        }
      } else if (bgState.failedDays.some(f => f.dayNumber === dayNum)) {
        const failInfo = bgState.failedDays.find(f => f.dayNumber === dayNum)
        states[dayNum] = {
          status: 'error',
          timeline: [],
          error: failInfo?.lastError || 'Generation failed',
        }
      } else if (bgState.pendingDays.includes(dayNum)) {
        states[dayNum] = {
          status: 'pending',
          timeline: [],
        }
      } else {
        states[dayNum] = {
          status: 'idle',
          timeline: [],
        }
      }
    })

    return states
  }, [plan, bgState])

  // ============================================================
  // generateSummary - Now triggers full background generation
  // ============================================================

  const generateSummary = useCallback(async (
    trip: TripBasics,
    preferences: TravelPreferences,
    userPreferences?: QuickQuestionsResponse
  ): Promise<boolean> => {
    setIsGeneratingSummary(true)
    setSummaryError(null)

    try {
      // Prefetch places first (needed by Edge Function)
      console.log('[useDayGeneration] Prefetching places for:', trip.destination)
      const placesData = await prefetchPlacesForAI(trip.destination)
      setFullPlaces(placesData.fullPlaces)

      // Start background generation (this triggers the Edge Function)
      console.log('[useDayGeneration] Starting background generation')
      const success = await startGeneration(
        preferences,
        placesData.fullPlaces
      )

      if (!success) {
        throw new Error('Failed to start generation')
      }

      // Note: The actual plan will be populated via Realtime subscription
      // Return true to indicate generation started successfully
      setIsGeneratingSummary(false)
      return true
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to start generation'
      setSummaryError(errorMsg)
      onError?.(errorMsg)
      setIsGeneratingSummary(false)
      return false
    }
  }, [startGeneration, onError])

  // ============================================================
  // startDayGeneration - Now a no-op (background handles all days)
  // ============================================================

  const startDayGeneration = useCallback(async (dayNumber: number) => {
    // In background mode, days are generated automatically by the Edge Function
    // This is kept for API compatibility but is essentially a no-op
    console.log(`[useDayGeneration] startDayGeneration(${dayNumber}) - handled by background process`)

    // If generation is paused, resume it
    if (bgState?.status === 'paused') {
      await resumeGeneration()
    }
  }, [bgState?.status, resumeGeneration])

  // ============================================================
  // startAllDaysGeneration - No-op (background handles this)
  // ============================================================

  const startAllDaysGeneration = useCallback(async () => {
    console.log('[useDayGeneration] startAllDaysGeneration - handled by background process')

    if (bgState?.status === 'paused') {
      await resumeGeneration()
    }
  }, [bgState?.status, resumeGeneration])

  // ============================================================
  // regenerateDay - Retry a failed day
  // ============================================================

  const regenerateDay = useCallback(async (dayNumber: number) => {
    console.log(`[useDayGeneration] regenerateDay(${dayNumber})`)
    await retryFailedDays(dayNumber)
  }, [retryFailedDays])

  // ============================================================
  // hydrateFromSavedState - Now handled automatically by Realtime
  // ============================================================

  const hydrateFromSavedState = useCallback((
    _savedState: GenerationSessionState,
    _existingPlan?: GeneratedPlan | null
  ): boolean => {
    // State is now automatically loaded from Supabase via useBackgroundGeneration
    console.log('[useDayGeneration] hydrateFromSavedState - handled automatically via Realtime')

    // Clear old localStorage state if it exists
    clearGenerationState(tripId)

    // Return true if there's work to continue (based on current background state)
    return bgState?.status === 'generating' ||
           bgState?.status === 'paused' ||
           (bgState?.pendingDays?.length ?? 0) > 0
  }, [tripId, bgState])

  // ============================================================
  // updatePlan - Update plan from external sources
  // ============================================================

  const updatePlan = useCallback((_updatedPlan: GeneratedPlan) => {
    // In background mode, plan is managed by Supabase
    // External updates should go through the save plan API
    console.log('[useDayGeneration] updatePlan - use savePlan hook instead')
  }, [])

  // ============================================================
  // reset - Clear all state
  // ============================================================

  const reset = useCallback(() => {
    setIsGeneratingSummary(false)
    setSummaryError(null)
    setIsHydrated(false)
    setFullPlaces(null)
    clearGenerationState(tripId)
    // Note: This doesn't clear Supabase state - that should be done via the API
  }, [tripId])

  // ============================================================
  // Helper functions
  // ============================================================

  const getDayStatus = useCallback((dayNumber: number): DayGenerationStatus => {
    return dayStates[dayNumber]?.status || 'idle'
  }, [dayStates])

  const getDayTimeline = useCallback((dayNumber: number): TimelineEntry[] => {
    if (!plan) return []
    const day = plan.itinerary.find(d => d.day === dayNumber)
    const timeline = day?.timeline || dayStates[dayNumber]?.timeline || []

    // Deduplicate by id to prevent React key collisions
    const seen = new Set<string>()
    return timeline.filter(entry => {
      if (seen.has(entry.id)) {
        console.warn(`[getDayTimeline] Duplicate timeline entry id: ${entry.id}`)
        return false
      }
      seen.add(entry.id)
      return true
    })
  }, [plan, dayStates])

  const isAnyDayGenerating = useMemo(() => {
    return isGenerating || Object.values(dayStates).some(s => s.status === 'generating')
  }, [isGenerating, dayStates])

  const allDaysComplete = useMemo(() => {
    if (!plan) return false
    return plan.itinerary.every(d => dayStates[d.day]?.status === 'completed')
  }, [plan, dayStates])

  const canResume = useCallback((): boolean => {
    return bgCanResume
  }, [bgCanResume])

  const getGenerationState = useCallback((): GenerationSessionState => {
    // Convert background state to legacy format
    return {
      tripId,
      status: bgState?.status || 'idle',
      currentDay: bgState?.currentDay ?? null,
      completedDays: bgState?.completedDays || [],
      pendingDays: bgState?.pendingDays || [],
      failedDays: bgState?.failedDays || [],
      summaryResult: null, // Not stored in new format
      placesContext: null,
      fullPlaces: fullPlaces as Record<string, unknown> | null,
      preferences: null,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }, [tripId, bgState, fullPlaces])

  // ============================================================
  // Return (same API as before)
  // ============================================================

  return {
    // State
    plan,
    dayStates,
    isGeneratingSummary: isGeneratingSummary || bgState?.status === 'generating_summary',
    summaryError: summaryError || (hasError ? bgState?.errorMessage : null),
    isHydrated,

    // Actions
    generateSummary,
    startDayGeneration,
    startAllDaysGeneration,
    reset,
    regenerateDay,
    hydrateFromSavedState,
    updatePlan,

    // New actions (for components that want to use them directly)
    pauseGeneration,
    resumeGeneration,

    // Helpers
    getDayStatus,
    getDayTimeline,
    isAnyDayGenerating,
    allDaysComplete,
    canRegenerate: canRetry || (plan !== null && !isGenerating),
    canResume,
    getGenerationState,

    // New: Progress info
    progress,
  }
}
