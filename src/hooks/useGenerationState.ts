'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { GenerationState, GenerationStateInsert, Json, FailedDay } from '@/types/database'

// ============================================
// Types
// ============================================

export type GenerationStatus = 'idle' | 'generating_summary' | 'generating' | 'completed' | 'paused' | 'error'

export interface GenerationStateData {
  tripId: string
  status: GenerationStatus
  currentDay: number | null
  completedDays: number[]
  pendingDays: number[]
  failedDays: FailedDay[]
  summaryResult: Record<string, unknown> | null
  placesContext: Record<string, unknown> | null
  preferences: Record<string, unknown> | null
}

// Helper to convert DB row to typed state
function dbToState(row: GenerationState): GenerationStateData {
  return {
    tripId: row.trip_id,
    status: (row.status as GenerationStatus) || 'idle',
    currentDay: row.current_day,
    completedDays: row.completed_days || [],
    pendingDays: row.pending_days || [],
    failedDays: (row.failed_days as unknown as FailedDay[]) || [],
    summaryResult: row.summary_result as Record<string, unknown> | null,
    placesContext: row.places_context as Record<string, unknown> | null,
    preferences: row.preferences as Record<string, unknown> | null,
  }
}

// ============================================
// useGenerationState - Obtiene el estado de generación
// ============================================

export function useGenerationState(tripId: string | null) {
  const [state, setState] = useState<GenerationStateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const fetchState = useCallback(async () => {
    if (!user || !tripId) {
      setState(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('generation_states')
        .select('*')
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        // PGRST116 = no rows returned, which is OK
        if (fetchError.code === 'PGRST116') {
          setState(null)
        } else {
          throw fetchError
        }
      } else {
        setState(dbToState(data))
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching generation state'))
    } finally {
      setLoading(false)
    }
  }, [user, tripId, supabase])

  useEffect(() => {
    fetchState()
  }, [fetchState])

  return { state, loading, error, refetch: fetchState }
}

// ============================================
// useSaveGenerationState - Guardar/actualizar estado (upsert)
// ============================================

export function useSaveGenerationState() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  // Debounce ref for frequent updates
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const pendingUpdateRef = useRef<{ tripId: string; state: Partial<GenerationStateData> } | null>(null)

  const saveState = useCallback(async (
    tripId: string,
    stateData: Partial<GenerationStateData>
  ): Promise<boolean> => {
    if (!user) {
      setError(new Error('User not authenticated'))
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Convert to DB format - trip_id and user_id are always required
      const dbData: GenerationStateInsert = {
        trip_id: tripId,
        user_id: user.id,
        status: stateData.status ?? 'idle',
        current_day: stateData.currentDay ?? null,
        completed_days: stateData.completedDays ?? [],
        pending_days: stateData.pendingDays ?? [],
        failed_days: (stateData.failedDays ?? []) as unknown as Json,
        summary_result: (stateData.summaryResult ?? null) as Json,
        places_context: (stateData.placesContext ?? null) as Json,
        preferences: (stateData.preferences ?? null) as Json,
      }

      // Upsert: insert or update on conflict
      const { error: upsertError } = await supabase
        .from('generation_states')
        .upsert(dbData, {
          onConflict: 'trip_id',
        })

      if (upsertError) throw upsertError
      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error saving generation state')
      setError(error)
      return false
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Debounced save for frequent updates during generation
  const saveStateDebounced = useCallback((
    tripId: string,
    stateData: Partial<GenerationStateData>,
    debounceMs: number = 500
  ) => {
    pendingUpdateRef.current = { tripId, state: stateData }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      if (pendingUpdateRef.current) {
        await saveState(pendingUpdateRef.current.tripId, pendingUpdateRef.current.state)
        pendingUpdateRef.current = null
      }
    }, debounceMs)
  }, [saveState])

  // Flush pending debounced save immediately
  const flushPendingSave = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (pendingUpdateRef.current) {
      await saveState(pendingUpdateRef.current.tripId, pendingUpdateRef.current.state)
      pendingUpdateRef.current = null
    }
  }, [saveState])

  return { saveState, saveStateDebounced, flushPendingSave, loading, error }
}

// ============================================
// useClearGenerationState - Limpiar estado (delete)
// ============================================

export function useClearGenerationState() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const clearState = useCallback(async (tripId: string): Promise<boolean> => {
    if (!user) {
      setError(new Error('User not authenticated'))
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('generation_states')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error clearing generation state')
      setError(error)
      return false
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  return { clearState, loading, error }
}
