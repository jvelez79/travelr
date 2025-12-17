'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { Trip, TripInsert, TripUpdate } from '@/types/database'

// ============================================
// useTrips - Lista todos los trips del usuario
// ============================================

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const fetchTrips = useCallback(async () => {
    if (!user) {
      setTrips([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setTrips(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching trips'))
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  return { trips, loading, error, refetch: fetchTrips }
}

// ============================================
// useTrip - Obtiene un trip específico
// ============================================

export function useTrip(id: string | null) {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const fetchTrip = useCallback(async () => {
    if (!user || !id) {
      setTrip(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (fetchError) throw fetchError
      setTrip(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching trip'))
    } finally {
      setLoading(false)
    }
  }, [user, id, supabase])

  useEffect(() => {
    fetchTrip()
  }, [fetchTrip])

  return { trip, loading, error, refetch: fetchTrip }
}

// ============================================
// useCreateTrip - Crear nuevo trip
// ============================================

export function useCreateTrip() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const createTrip = useCallback(async (
    tripData: Omit<TripInsert, 'user_id'>
  ): Promise<Trip | null> => {
    if (!user) {
      setError(new Error('User not authenticated'))
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from('trips')
        .insert({
          ...tripData,
          user_id: user.id,
        })
        .select()
        .single()

      if (insertError) throw insertError
      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error creating trip')
      setError(error)
      return null
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  return { createTrip, loading, error }
}

// ============================================
// useUpdateTrip - Actualizar trip existente
// ============================================

export function useUpdateTrip() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const updateTrip = useCallback(async (
    id: string,
    updates: TripUpdate
  ): Promise<Trip | null> => {
    if (!user) {
      setError(new Error('User not authenticated'))
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: updateError } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError
      return data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error updating trip')
      setError(error)
      return null
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  return { updateTrip, loading, error }
}

// ============================================
// useDeleteTrip - Eliminar trip
// ============================================

export function useDeleteTrip() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const deleteTrip = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      setError(new Error('User not authenticated'))
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('trips')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error deleting trip')
      setError(error)
      return false
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  return { deleteTrip, loading, error }
}
