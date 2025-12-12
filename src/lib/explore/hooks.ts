"use client"

import { useState, useEffect, useCallback } from "react"
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
  error: Error | null
  refetch: () => void
}

/**
 * Hook to fetch places from the API
 */
export function usePlaces({
  destination,
  location,
  category,
  enabled = true,
}: UsePlacesOptions): UsePlacesResult {
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchPlaces = useCallback(async () => {
    if (!enabled || !destination || location.lat === 0) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        destination,
        category,
        lat: location.lat.toString(),
        lng: location.lng.toString(),
      })

      const response = await fetch(`/api/explore/places?${params}`)

      if (!response.ok) {
        throw new Error("Failed to fetch places")
      }

      const data = await response.json()
      setPlaces(data.places || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
      setPlaces([])
    } finally {
      setIsLoading(false)
    }
  }, [destination, location.lat, location.lng, category, enabled])

  useEffect(() => {
    fetchPlaces()
  }, [fetchPlaces])

  return {
    places,
    isLoading,
    error,
    refetch: fetchPlaces,
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
export function useDestinationInfo(placeId: string | null) {
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
