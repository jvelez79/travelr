'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type {
  CuratedDiscoveryResponse,
  CuratedPlace,
  CuratedCategoryType,
} from '@/types/curated'

// ============================================
// Types
// ============================================

interface UseCuratedDiscoveryOptions {
  tripId?: string
  destination: string | null
  autoFetch?: boolean // Default true
}

interface CuratedDiscoveryState {
  data: CuratedDiscoveryResponse | null
  loading: boolean
  error: Error | null
}

// ============================================
// useCuratedDiscovery - Fetch curated recommendations
// ============================================

export function useCuratedDiscovery({
  tripId,
  destination,
  autoFetch = true,
}: UseCuratedDiscoveryOptions) {
  const [state, setState] = useState<CuratedDiscoveryState>({
    data: null,
    loading: false,
    error: null,
  })
  const { user } = useAuth()

  // Track if we've already fetched for this destination
  const fetchedForRef = useRef<string | null>(null)

  const fetchCurated = useCallback(async (force = false) => {
    if (!user || !destination) {
      setState({ data: null, loading: false, error: null })
      return
    }

    // Skip if already fetched for this destination (unless forced)
    const cacheKey = `${destination}-${tripId || 'no-trip'}`
    if (!force && fetchedForRef.current === cacheKey && state.data) {
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch('/api/ai/curated-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          destination,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch: ${response.status}`)
      }

      const data: CuratedDiscoveryResponse = await response.json()
      fetchedForRef.current = cacheKey

      setState({
        data,
        loading: false,
        error: null,
      })
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error('Unknown error'),
      })
    }
  }, [user, destination, tripId, state.data])

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && destination && user) {
      fetchCurated()
    }
  }, [autoFetch, destination, user]) // Intentionally not including fetchCurated to avoid loops

  // Refresh function
  const refresh = useCallback(() => {
    fetchedForRef.current = null
    return fetchCurated(true)
  }, [fetchCurated])

  return {
    ...state,
    refresh,
    fetchCurated,
  }
}

// ============================================
// Helper: Get places by category
// ============================================

export function getPlacesByCategory(
  data: CuratedDiscoveryResponse | null,
  category: CuratedCategoryType
): CuratedPlace[] {
  if (!data) return []

  switch (category) {
    case 'must_see_attractions':
      return data.sections.mustSeeAttractions
    case 'outstanding_restaurants':
      return data.sections.outstandingRestaurants
    case 'unique_experiences':
      return data.sections.uniqueExperiences
    default:
      return []
  }
}

// ============================================
// Helper: Get total curated places count
// ============================================

export function getTotalCuratedCount(data: CuratedDiscoveryResponse | null): number {
  if (!data) return 0

  return (
    data.sections.mustSeeAttractions.length +
    data.sections.outstandingRestaurants.length +
    data.sections.uniqueExperiences.length
  )
}
