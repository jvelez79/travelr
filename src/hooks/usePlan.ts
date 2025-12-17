'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { Plan, PlanInsert, Json } from '@/types/database'

// ============================================
// Types
// ============================================

export interface PlanData {
  [key: string]: unknown
}

// ============================================
// usePlan - Obtiene el plan de un trip
// ============================================

export function usePlan(tripId: string | null) {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [planData, setPlanData] = useState<PlanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  // Track if we've already fetched for this tripId to avoid refetch on auth state changes
  const hasFetchedRef = useRef<string | null>(null)
  // Track if plan doesn't exist (vs just not fetched yet)
  const planNotFoundRef = useRef(false)

  const fetchPlan = useCallback(async (force = false) => {
    const userId = user?.id
    if (!userId || !tripId) {
      setPlan(null)
      setPlanData(null)
      setLoading(false)
      return
    }

    // Skip refetch if we already have data for this trip (unless forced)
    const cacheKey = `${userId}-${tripId}`
    if (!force && hasFetchedRef.current === cacheKey && (plan || planNotFoundRef.current)) {
      return
    }

    // Only show loading if we don't have data yet
    if (!plan && !planNotFoundRef.current) {
      setLoading(true)
    }
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('plans')
        .select('*')
        .eq('trip_id', tripId)
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        // PGRST116 = no rows returned, which is OK for new trips
        if (fetchError.code === 'PGRST116') {
          setPlan(null)
          setPlanData(null)
          planNotFoundRef.current = true
        } else {
          throw fetchError
        }
      } else {
        setPlan(data)
        setPlanData(data?.data as PlanData || null)
        planNotFoundRef.current = false
      }
      hasFetchedRef.current = cacheKey
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching plan'))
    } finally {
      setLoading(false)
    }
  }, [user?.id, tripId, supabase, plan])

  useEffect(() => {
    fetchPlan()
  }, [user?.id, tripId]) // Only refetch when user ID or trip ID changes, not on every callback change

  const refetch = useCallback(() => fetchPlan(true), [fetchPlan])

  return { plan, planData, loading, error, refetch }
}

// ============================================
// useSavePlan - Guardar/actualizar plan (upsert)
// ============================================

export function useSavePlan() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const savePlan = useCallback(async (
    tripId: string,
    data: PlanData
  ): Promise<Plan | null> => {
    if (!user) {
      setError(new Error('User not authenticated'))
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Check if plan exists
      const { data: existingPlan } = await supabase
        .from('plans')
        .select('id, version')
        .eq('trip_id', tripId)
        .eq('user_id', user.id)
        .single()

      let result: Plan | null = null

      if (existingPlan) {
        // Update existing plan
        const { data: updatedPlan, error: updateError } = await supabase
          .from('plans')
          .update({
            data: data as Json,
            version: (existingPlan.version || 1) + 1,
          })
          .eq('id', existingPlan.id)
          .select()
          .single()

        if (updateError) throw updateError
        result = updatedPlan
      } else {
        // Insert new plan
        const { data: newPlan, error: insertError } = await supabase
          .from('plans')
          .insert({
            trip_id: tripId,
            user_id: user.id,
            data: data as Json,
            version: 1,
          })
          .select()
          .single()

        if (insertError) throw insertError
        result = newPlan
      }

      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error saving plan')
      setError(error)
      return null
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  return { savePlan, loading, error }
}

// ============================================
// useDeletePlan - Eliminar plan
// ============================================

export function useDeletePlan() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const deletePlan = useCallback(async (tripId: string): Promise<boolean> => {
    if (!user) {
      setError(new Error('User not authenticated'))
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('plans')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error deleting plan')
      setError(error)
      return false
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  return { deletePlan, loading, error }
}
