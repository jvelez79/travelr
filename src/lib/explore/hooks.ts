"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Place, PlaceCategory, Coordinates } from "@/types/explore"

interface UsePlacesOptions {
  destination: string
  location: Coordinates
  category: PlaceCategory
  enabled?: boolean
}

interface UsePlacesResult {
  places: Place[]
  isLoading: boolean
  isLoadingMore: boolean
  error: Error | null
  hasMore: boolean
  refetch: () => void
  loadMore: () => void
}

/**
 * Hook to fetch places from the API with pagination support
 */
export function usePlaces({
  destination,
  location,
  category,
  enabled = true,
}: UsePlacesOptions): UsePlacesResult {
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)

  // Track current search params to detect changes
  const searchParamsRef = useRef({ destination, category, lat: location.lat, lng: location.lng })

  const fetchPlaces = useCallback(async (pageToken?: string) => {
    if (!enabled || !destination || location.lat === 0) return

    const isLoadMore = !!pageToken
    if (isLoadMore) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
      setError(null)
    }

    try {
      const params = new URLSearchParams({
        destination,
        category,
        lat: location.lat.toString(),
        lng: location.lng.toString(),
      })

      if (pageToken) {
        params.set("pageToken", pageToken)
      }

      const response = await fetch(`/api/explore/places?${params}`)

      if (!response.ok) {
        throw new Error("Failed to fetch places")
      }

      const data = await response.json()

      if (isLoadMore) {
        // Append to existing places
        setPlaces(prev => [...prev, ...(data.places || [])])
      } else {
        // Replace places
        setPlaces(data.places || [])
      }

      setNextPageToken(data.nextPageToken || null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
      if (!isLoadMore) {
        setPlaces([])
      }
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false)
      } else {
        setIsLoading(false)
      }
    }
  }, [destination, location.lat, location.lng, category, enabled])

  // Reset and refetch when search params change
  useEffect(() => {
    const paramsChanged =
      searchParamsRef.current.destination !== destination ||
      searchParamsRef.current.category !== category ||
      searchParamsRef.current.lat !== location.lat ||
      searchParamsRef.current.lng !== location.lng

    if (paramsChanged) {
      searchParamsRef.current = { destination, category, lat: location.lat, lng: location.lng }
      setPlaces([])
      setNextPageToken(null)
    }

    fetchPlaces()
  }, [fetchPlaces, destination, category, location.lat, location.lng])

  const loadMore = useCallback(() => {
    if (nextPageToken && !isLoadingMore) {
      fetchPlaces(nextPageToken)
    }
  }, [nextPageToken, isLoadingMore, fetchPlaces])

  const refetch = useCallback(() => {
    setPlaces([])
    setNextPageToken(null)
    fetchPlaces()
  }, [fetchPlaces])

  return {
    places,
    isLoading,
    isLoadingMore,
    error,
    hasMore: !!nextPageToken,
    refetch,
    loadMore,
  }
}

interface DestinationSuggestion {
  placeId: string
  description: string
  mainText: string
}

interface UseDestinationSearchResult {
  suggestions: DestinationSuggestion[]
  isLoading: boolean
  search: (query: string) => void
}

/**
 * Hook for destination autocomplete search
 */
export function useDestinationSearch(): UseDestinationSearchResult {
  const [suggestions, setSuggestions] = useState<DestinationSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/explore/destinations?q=${encodeURIComponent(query)}`)

      if (!response.ok) {
        throw new Error("Failed to search destinations")
      }

      const data = await response.json()
      setSuggestions(data.suggestions || [])
    } catch {
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    suggestions,
    isLoading,
    search,
  }
}

/**
 * Hook to get destination info by place ID
 */
function useDestinationInfo(placeId: string | null) {
  const [info, setInfo] = useState<{
    name: string
    fullName: string
    country: string
    location: Coordinates
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!placeId) {
      setInfo(null)
      return
    }

    const fetchInfo = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/explore/destinations?placeId=${placeId}`)
        if (response.ok) {
          const data = await response.json()
          setInfo(data)
        }
      } catch {
        setInfo(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInfo()
  }, [placeId])

  return { info, isLoading }
}

interface UsePlaceSearchOptions {
  destination: string
  location: Coordinates
  enabled?: boolean
  debounceMs?: number
}

interface UsePlaceSearchResult {
  results: Place[]
  isSearching: boolean
  error: Error | null
  search: (query: string) => void
  clearResults: () => void
}

/**
 * Hook for searching places by text with debounce
 */
export function usePlaceSearch({
  destination,
  location,
  enabled = true,
  debounceMs = 500,
}: UsePlaceSearchOptions): UsePlaceSearchResult {
  const [results, setResults] = useState<Place[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const search = useCallback((query: string) => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // If query is empty, clear results immediately
    if (!query.trim()) {
      setResults([])
      setIsSearching(false)
      setError(null)
      return
    }

    // Set debounce timeout
    debounceTimeoutRef.current = setTimeout(async () => {
      if (!enabled || !destination || location.lat === 0) return

      setIsSearching(true)
      setError(null)

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController()

      try {
        const params = new URLSearchParams({
          destination,
          query: query.trim(),
          lat: location.lat.toString(),
          lng: location.lng.toString(),
        })

        const response = await fetch(`/api/explore/places?${params}`, {
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error("Failed to search places")
        }

        const data = await response.json()
        setResults(data.places || [])
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        setError(err instanceof Error ? err : new Error("Unknown error"))
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, debounceMs)
  }, [destination, location.lat, location.lng, enabled, debounceMs])

  const clearResults = useCallback(() => {
    // Cancel any pending requests
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setResults([])
    setIsSearching(false)
    setError(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    results,
    isSearching,
    error,
    search,
    clearResults,
  }
}
