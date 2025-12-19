'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type {
  GenerationState,
  Plan,
  FailedDay,
  GenerationStatus as DbGenerationStatus,
} from '@/types/database'
import type { GeneratedPlan, TravelPreferences } from '@/types/plan'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// ============================================
// Types
// ============================================

type GenerationStatus = DbGenerationStatus

interface BackgroundGenerationState {
  tripId: string
  status: GenerationStatus
  currentDay: number | null
  completedDays: number[]
  pendingDays: number[]
  failedDays: FailedDay[]
  errorMessage: string | null
  retryCount: number
}

interface GenerationProgress {
  completed: number
  total: number
  currentDay: number | null
  percentage: number
}

interface UseBackgroundGenerationOptions {
  tripId: string | null
  onDayComplete?: (dayNumber: number) => void
  onAllComplete?: () => void
  onError?: (error: string) => void
}

// Helper: Convert DB row to typed state
function dbToState(row: GenerationState): BackgroundGenerationState {
  return {
    tripId: row.trip_id,
    status: (row.status as GenerationStatus) || 'idle',
    currentDay: row.current_day,
    completedDays: row.completed_days || [],
    pendingDays: row.pending_days || [],
    failedDays: (row.failed_days as unknown as FailedDay[]) || [],
    errorMessage: row.error_message,
    retryCount: row.retry_count || 0,
  }
}

// ============================================
// useBackgroundGeneration
// Main hook for background generation with Realtime
// ============================================

export function useBackgroundGeneration({
  tripId,
  onDayComplete,
  onAllComplete,
  onError,
}: UseBackgroundGenerationOptions) {
  // State
  const [state, setState] = useState<BackgroundGenerationState | null>(null)
  const [plan, setPlan] = useState<GeneratedPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Refs for callbacks to avoid stale closures
  const onDayCompleteRef = useRef(onDayComplete)
  const onAllCompleteRef = useRef(onAllComplete)
  const onErrorRef = useRef(onError)
  const previousCompletedDaysRef = useRef<number[]>([])

  // Auth and Supabase
  const { user } = useAuth()
  const supabase = createClient()

  // Update refs when callbacks change
  useEffect(() => {
    onDayCompleteRef.current = onDayComplete
    onAllCompleteRef.current = onAllComplete
    onErrorRef.current = onError
  }, [onDayComplete, onAllComplete, onError])

  // ============================================
  // Initial Data Fetch
  // ============================================

  const fetchInitialData = useCallback(async () => {
    if (!user || !tripId) {
      setState(null)
      setPlan(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch generation state and plan in parallel
      // Use maybeSingle() instead of single() to avoid 406 errors when no rows exist
      const [stateResult, planResult] = await Promise.all([
        supabase
          .from('generation_states')
          .select('*')
          .eq('trip_id', tripId)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('plans')
          .select('*')
          .eq('trip_id', tripId)
          .eq('user_id', user.id)
          .maybeSingle(),
      ])

      // Handle generation state
      if (stateResult.error) {
        throw stateResult.error
      }
      if (stateResult.data) {
        const newState = dbToState(stateResult.data)
        setState(newState)
        previousCompletedDaysRef.current = newState.completedDays
      } else {
        setState(null)
      }

      // Handle plan
      if (planResult.error) {
        throw planResult.error
      }
      if (planResult.data?.data) {
        setPlan(planResult.data.data as unknown as GeneratedPlan)
      } else {
        setPlan(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching data'))
    } finally {
      setLoading(false)
    }
  }, [user, tripId, supabase])

  // ============================================
  // Realtime Subscription
  // ============================================

  useEffect(() => {
    if (!user || !tripId) return

    // Initial fetch
    fetchInitialData()

    // Set up Realtime subscriptions
    const channel: RealtimeChannel = supabase
      .channel(`generation-${tripId}`)
      // Subscribe to generation_states changes
      .on<GenerationState>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generation_states',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload: RealtimePostgresChangesPayload<GenerationState>) => {
          console.log('[useBackgroundGeneration] State change:', payload.eventType)

          if (payload.eventType === 'DELETE') {
            setState(null)
            return
          }

          const newData = payload.new as GenerationState
          const newState = dbToState(newData)
          setState(newState)

          // Check for newly completed days
          const previousDays = previousCompletedDaysRef.current
          const newlyCompleted = newState.completedDays.filter(
            (day) => !previousDays.includes(day)
          )
          newlyCompleted.forEach((day) => {
            onDayCompleteRef.current?.(day)
          })
          previousCompletedDaysRef.current = newState.completedDays

          // Check for completion
          if (newState.status === 'completed') {
            onAllCompleteRef.current?.()
          }

          // Check for errors
          if (newState.status === 'error' && newState.errorMessage) {
            onErrorRef.current?.(newState.errorMessage)
          }
        }
      )
      // Subscribe to plans changes
      .on<Plan>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plans',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload: RealtimePostgresChangesPayload<Plan>) => {
          console.log('[useBackgroundGeneration] Plan change:', payload.eventType)

          if (payload.eventType === 'DELETE') {
            setPlan(null)
            return
          }

          const newData = payload.new as Plan
          if (newData?.data) {
            setPlan(newData.data as unknown as GeneratedPlan)
          }
        }
      )
      .subscribe((status) => {
        console.log('[useBackgroundGeneration] Subscription status:', status)
      })

    // Cleanup
    return () => {
      console.log('[useBackgroundGeneration] Unsubscribing from channel')
      supabase.removeChannel(channel)
    }
  }, [user, tripId, supabase, fetchInitialData])

  // ============================================
  // Actions
  // ============================================

  /**
   * Start generation from the beginning
   */
  const startGeneration = useCallback(async (
    preferences: TravelPreferences,
    fullPlaces?: Record<string, unknown> | null
  ): Promise<boolean> => {
    if (!tripId) {
      setError(new Error('No tripId provided'))
      return false
    }

    try {
      const response = await fetch('/api/generation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, preferences, fullPlaces }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start generation')
      }

      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start generation')
      setError(error)
      onErrorRef.current?.(error.message)
      return false
    }
  }, [tripId])

  /**
   * Pause the current generation
   */
  const pauseGeneration = useCallback(async (): Promise<boolean> => {
    if (!tripId) {
      setError(new Error('No tripId provided'))
      return false
    }

    try {
      const response = await fetch('/api/generation/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to pause generation')
      }

      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to pause generation')
      setError(error)
      return false
    }
  }, [tripId])

  /**
   * Resume a paused generation
   */
  const resumeGeneration = useCallback(async (): Promise<boolean> => {
    if (!tripId) {
      setError(new Error('No tripId provided'))
      return false
    }

    try {
      const response = await fetch('/api/generation/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to resume generation')
      }

      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to resume generation')
      setError(error)
      return false
    }
  }, [tripId])

  /**
   * Retry failed days
   * @param dayNumber Optional specific day to retry, or retry all failed days
   */
  const retryFailedDays = useCallback(async (dayNumber?: number): Promise<boolean> => {
    if (!tripId) {
      setError(new Error('No tripId provided'))
      return false
    }

    try {
      const response = await fetch('/api/generation/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, dayNumber }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to retry generation')
      }

      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to retry generation')
      setError(error)
      return false
    }
  }, [tripId])

  // ============================================
  // Computed Values
  // ============================================

  const isGenerating = state?.status === 'generating' || state?.status === 'generating_summary'
  const isPaused = state?.status === 'paused'
  const isCompleted = state?.status === 'completed'
  const hasError = state?.status === 'error'
  const canResume = isPaused && (state?.pendingDays?.length ?? 0) > 0
  const canRetry = (state?.failedDays?.length ?? 0) > 0

  const progress: GenerationProgress = {
    completed: state?.completedDays?.length ?? 0,
    total: (state?.completedDays?.length ?? 0) + (state?.pendingDays?.length ?? 0),
    currentDay: state?.currentDay ?? null,
    percentage: state
      ? Math.round(
          ((state.completedDays?.length ?? 0) /
            Math.max(
              (state.completedDays?.length ?? 0) + (state.pendingDays?.length ?? 0),
              1
            )) *
            100
        )
      : 0,
  }

  // ============================================
  // Return
  // ============================================

  return {
    // Data
    state,
    plan,
    loading,
    error,

    // Status flags
    isGenerating,
    isPaused,
    isCompleted,
    hasError,
    canResume,
    canRetry,

    // Progress
    progress,

    // Actions
    startGeneration,
    pauseGeneration,
    resumeGeneration,
    retryFailedDays,

    // Manual refresh
    refetch: fetchInitialData,
  }
}
