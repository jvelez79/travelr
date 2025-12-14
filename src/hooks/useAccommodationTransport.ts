import { useState, useEffect, useRef } from "react"
import type { AccommodationSuggestion, TimelineEntry, TravelInfo } from "@/types/plan"
import {
  fetchDirections,
  calculateDistance,
  suggestTransportMode,
  type Coordinates,
} from "@/lib/transportUtils"

// Minimum distance (meters) to show transport
const MIN_DISTANCE_METERS = 100

interface UseAccommodationTransportResult {
  travelInfo: TravelInfo | null
  isLoading: boolean
}

/**
 * Hook to calculate transport from accommodation to first activity of the day.
 *
 * @param accommodation - The accommodation for the night before (or null)
 * @param firstActivity - The first activity of the day (or null)
 * @returns Object with travelInfo and loading state
 */
export function useAccommodationTransport(
  accommodation: AccommodationSuggestion | null,
  firstActivity: TimelineEntry | null
): UseAccommodationTransportResult {
  const [travelInfo, setTravelInfo] = useState<TravelInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Track the last calculated pair to avoid duplicate requests
  const lastCalculatedRef = useRef<string | null>(null)

  useEffect(() => {
    // Reset if no accommodation or no first activity
    if (!accommodation || !firstActivity) {
      setTravelInfo(null)
      setIsLoading(false)
      lastCalculatedRef.current = null
      return
    }

    // Get coordinates
    const accommodationCoords: Coordinates | null = accommodation.location
      ? { lat: accommodation.location.lat, lng: accommodation.location.lng }
      : null

    const activityCoords: Coordinates | null = firstActivity.placeData?.coordinates
      ? firstActivity.placeData.coordinates
      : null

    // Can't calculate without both coordinates
    if (!accommodationCoords || !activityCoords) {
      setTravelInfo(null)
      setIsLoading(false)
      lastCalculatedRef.current = null
      return
    }

    // Create a key to track what we're calculating
    const calcKey = `${accommodationCoords.lat},${accommodationCoords.lng}-${activityCoords.lat},${activityCoords.lng}`

    // Skip if we already calculated this pair
    if (lastCalculatedRef.current === calcKey) {
      return
    }

    // Check distance - skip if too close (same location)
    const distance = calculateDistance(accommodationCoords, activityCoords)
    if (distance < MIN_DISTANCE_METERS) {
      setTravelInfo(null)
      setIsLoading(false)
      lastCalculatedRef.current = calcKey
      return
    }

    // Determine transport mode
    const mode = suggestTransportMode(distance)

    // Fetch directions
    let isCancelled = false
    setIsLoading(true)

    fetchDirections(accommodationCoords, activityCoords, mode)
      .then((result) => {
        if (!isCancelled) {
          setTravelInfo(result)
          setIsLoading(false)
          lastCalculatedRef.current = calcKey
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          console.error("[useAccommodationTransport] Error:", error)
          setTravelInfo(null)
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [
    accommodation?.location?.lat,
    accommodation?.location?.lng,
    firstActivity?.placeData?.coordinates?.lat,
    firstActivity?.placeData?.coordinates?.lng,
  ])

  return { travelInfo, isLoading }
}
