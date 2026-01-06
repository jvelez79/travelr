'use client'

import { useState, useCallback, useRef } from 'react'

// In-memory cache for photos (persists during session)
const photosCache = new Map<string, string[]>()

interface UsePlacePhotosReturn {
  photos: string[]
  isLoading: boolean
  error: string | null
  loadPhotos: (placeId: string, existingPhotos?: string[]) => Promise<string[]>
}

/**
 * Hook for lazy loading place photos from Google Places API
 * Caches results in memory to avoid redundant API calls
 */
export function usePlacePhotos(): UsePlacePhotosReturn {
  const [photos, setPhotos] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadingRef = useRef<string | null>(null)

  const loadPhotos = useCallback(async (
    placeId: string,
    existingPhotos: string[] = []
  ): Promise<string[]> => {
    // Check cache first
    if (photosCache.has(placeId)) {
      const cached = photosCache.get(placeId)!
      setPhotos(cached)
      return cached
    }

    // Prevent duplicate requests
    if (loadingRef.current === placeId) {
      return existingPhotos
    }

    loadingRef.current = placeId
    setIsLoading(true)
    setError(null)
    setPhotos(existingPhotos) // Show existing photos while loading

    try {
      const response = await fetch(`/api/places/photos?placeId=${encodeURIComponent(placeId)}`)

      if (!response.ok) {
        throw new Error('Failed to fetch photos')
      }

      const data = await response.json()
      const newPhotos = data.photos || []

      // Cache the result
      photosCache.set(placeId, newPhotos)
      setPhotos(newPhotos)
      return newPhotos
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('[usePlacePhotos] Error:', errorMessage)
      return existingPhotos // Return existing photos on error
    } finally {
      setIsLoading(false)
      loadingRef.current = null
    }
  }, [])

  return {
    photos,
    isLoading,
    error,
    loadPhotos,
  }
}
