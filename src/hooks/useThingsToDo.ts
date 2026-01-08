'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

// ============================================
// Types
// ============================================

export interface ThingsToDoItem {
  id: string
  trip_id: string
  google_place_id: string
  place_data: {
    name: string
    formatted_address?: string
    rating?: number
    user_ratings_total?: number
    types?: string[]
    photos?: Array<{ photo_reference: string }>
    opening_hours?: {
      open_now?: boolean
      weekday_text?: string[]
    }
    price_level?: number
    editorial_summary?: { overview: string }
    geometry?: {
      location: { lat: number; lng: number }
    }
  }
  category: 'attractions' | 'food_drink' | 'tours' | 'activities' | null
  created_at: string
}

export interface AddToThingsToDoInput {
  tripId: string
  googlePlaceId: string
  placeData: ThingsToDoItem['place_data']
  category?: ThingsToDoItem['category']
}

// ============================================
// useThingsToDo - Get all Things To Do for a trip
// ============================================

export function useThingsToDo(tripId: string | null) {
  const [items, setItems] = useState<ThingsToDoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const fetchItems = useCallback(async () => {
    if (!user || !tripId) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('trip_things_to_do')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      // Cast the data to our expected type
      setItems((data || []) as unknown as ThingsToDoItem[])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching things to do'))
    } finally {
      setLoading(false)
    }
  }, [user, tripId, supabase])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  return { items, loading, error, refetch: fetchItems }
}

// ============================================
// useAddToThingsToDo - Add item to Things To Do
// ============================================

export function useAddToThingsToDo() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const addItem = useCallback(async (input: AddToThingsToDoInput): Promise<ThingsToDoItem | null> => {
    if (!user) {
      setError(new Error('User not authenticated'))
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from('trip_things_to_do')
        .insert({
          trip_id: input.tripId,
          google_place_id: input.googlePlaceId,
          place_data: input.placeData,
          category: input.category || null,
        })
        .select()
        .single()

      if (insertError) {
        // Handle duplicate error gracefully
        if (insertError.code === '23505') {
          setError(new Error('This place is already in your Things To Do'))
          return null
        }
        throw insertError
      }
      return data as unknown as ThingsToDoItem
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error adding to things to do')
      setError(error)
      return null
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  return { addItem, loading, error }
}

// ============================================
// useRemoveFromThingsToDo - Remove item from Things To Do
// ============================================

export function useRemoveFromThingsToDo() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  const removeItem = useCallback(async (itemId: string): Promise<boolean> => {
    if (!user) {
      setError(new Error('User not authenticated'))
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('trip_things_to_do')
        .delete()
        .eq('id', itemId)

      if (deleteError) throw deleteError
      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error removing from things to do')
      setError(error)
      return false
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  return { removeItem, loading, error }
}

// ============================================
// useIsInThingsToDo - Check if a place is already in Things To Do
// ============================================

export function useIsInThingsToDo(tripId: string | null, googlePlaceId: string | null) {
  const [isInList, setIsInList] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    const checkIfInList = async () => {
      if (!user || !tripId || !googlePlaceId) {
        setIsInList(false)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('trip_things_to_do')
          .select('id')
          .eq('trip_id', tripId)
          .eq('google_place_id', googlePlaceId)
          .maybeSingle()

        if (error) throw error
        setIsInList(!!data)
      } catch {
        setIsInList(false)
      } finally {
        setLoading(false)
      }
    }

    checkIfInList()
  }, [user, tripId, googlePlaceId, supabase])

  return { isInList, loading }
}
