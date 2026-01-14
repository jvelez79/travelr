/**
 * useSearchSync - Bidirectional synchronization between search results and map
 *
 * Handles:
 * 1. Adjusting map bounds when search results change
 * 2. Notifying parent when user moves/zooms the map
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import type { Place } from "@/types/explore"

interface UseSearchSyncOptions {
  places: Place[]
  onBoundsChange: (bounds: google.maps.LatLngBounds) => void
}

export function useSearchSync({ places, onBoundsChange }: UseSearchSyncOptions) {
  const [map, setMap] = useState<google.maps.Map | null>(null)

  // 1. Adjust map bounds when places change
  useEffect(() => {
    if (!map || places.length === 0) return

    const bounds = new google.maps.LatLngBounds()
    places.forEach(place => {
      bounds.extend({ lat: place.location.lat, lng: place.location.lng })
    })

    map.fitBounds(bounds)
  }, [places, map])

  // 2. Notify when user moves/zooms map
  const handleMapIdle = useCallback(() => {
    if (!map) return
    const newBounds = map.getBounds()
    if (newBounds) {
      onBoundsChange(newBounds)
    }
  }, [map, onBoundsChange])

  return {
    map,
    onMapLoad: setMap,
    onMapIdle: handleMapIdle,
  }
}

/**
 * Helper: Check if two bounds are equal
 */
export function areBoundsEqual(
  a: google.maps.LatLngBounds | null,
  b: google.maps.LatLngBounds | null
): boolean {
  if (!a || !b) return a === b
  const ne1 = a.getNorthEast()
  const sw1 = a.getSouthWest()
  const ne2 = b.getNorthEast()
  const sw2 = b.getSouthWest()
  return (
    ne1.lat() === ne2.lat() &&
    ne1.lng() === ne2.lng() &&
    sw1.lat() === sw2.lat() &&
    sw1.lng() === sw2.lng()
  )
}
