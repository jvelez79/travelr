/**
 * Transport Utilities
 *
 * Core logic for calculating transportation between activities.
 * Uses Google Maps Directions API with server-side Supabase caching.
 * The cache is global and shared between all users.
 */

import type { TimelineEntry, TravelInfo, TransportMethod } from "@/types/plan"

export interface Coordinates {
  lat: number
  lng: number
}

// Minimum distance (meters) to consider transport calculation worthwhile
const MIN_DISTANCE_METERS = 100

// Rate limiting: max concurrent requests and delay between batches
const BATCH_SIZE = 5
const BATCH_DELAY_MS = 200

/**
 * Extract coordinates from a timeline activity
 * Returns null if coordinates are not available
 */
export function getActivityCoordinates(activity: TimelineEntry): Coordinates | null {
  if (activity.placeData?.coordinates) {
    return activity.placeData.coordinates
  }
  return null
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371000 // Earth's radius in meters
  const lat1Rad = (from.lat * Math.PI) / 180
  const lat2Rad = (to.lat * Math.PI) / 180
  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Suggest transport mode based on distance
 * - Walking for < 500m
 * - Driving for >= 500m
 */
export function suggestTransportMode(distanceMeters: number): TransportMethod {
  if (distanceMeters < 500) {
    return "walking"
  }
  return "driving"
}

/**
 * Determine if transport should be calculated between two activities
 *
 * Returns false if:
 * - Either activity doesn't have coordinates
 * - Activities are too close (< 100m - same location)
 */
export function shouldCalculateTransport(
  fromActivity: TimelineEntry,
  toActivity: TimelineEntry
): boolean {
  const fromCoords = getActivityCoordinates(fromActivity)
  const toCoords = getActivityCoordinates(toActivity)

  // Skip if either activity has no coordinates
  if (!fromCoords || !toCoords) {
    return false
  }

  // Skip if activities are at the same location or very close
  const distance = calculateDistance(fromCoords, toCoords)
  if (distance < MIN_DISTANCE_METERS) {
    return false
  }

  return true
}

/**
 * Fetch directions from API
 * The API handles caching server-side in Supabase (global cache)
 * Returns null if request fails (graceful degradation)
 */
export async function fetchDirections(
  from: Coordinates,
  to: Coordinates,
  mode: TransportMethod
): Promise<TravelInfo | null> {
  try {
    const params = new URLSearchParams({
      originLat: from.lat.toString(),
      originLng: from.lng.toString(),
      destLat: to.lat.toString(),
      destLng: to.lng.toString(),
      mode,
    })

    const response = await fetch(`/api/directions?${params}`)

    if (!response.ok) {
      console.warn("[transportUtils] API error:", response.status)
      return null
    }

    const travelInfo: TravelInfo = await response.json()
    return travelInfo
  } catch (error) {
    console.error("[transportUtils] Failed to fetch directions:", error)
    return null
  }
}

/**
 * Calculate transport for a single activity pair
 * Returns the travelInfo or null if not applicable
 */
async function calculateTransportBetween(
  fromActivity: TimelineEntry,
  toActivity: TimelineEntry
): Promise<TravelInfo | null> {
  if (!shouldCalculateTransport(fromActivity, toActivity)) {
    return null
  }

  const fromCoords = getActivityCoordinates(fromActivity)!
  const toCoords = getActivityCoordinates(toActivity)!

  // Calculate distance to suggest transport mode
  const distance = calculateDistance(fromCoords, toCoords)
  const suggestedMode = suggestTransportMode(distance)

  return fetchDirections(fromCoords, toCoords, suggestedMode)
}

/**
 * Calculate transport for entire timeline
 *
 * - Processes activities in batches to respect rate limits
 * - Uses cache to avoid duplicate API calls
 * - Updates travelToNext for each activity (except last)
 * - Calls onProgress callback to report progress
 *
 * Returns updated timeline with travelToNext populated
 */
export async function calculateTransportForTimeline(
  timeline: TimelineEntry[],
  onProgress?: (completed: number, total: number) => void
): Promise<TimelineEntry[]> {
  if (timeline.length < 2) {
    // No transport needed for 0 or 1 activity
    return timeline.map((activity, index) => {
      // Remove travelToNext from last activity
      if (index === timeline.length - 1) {
        const { travelToNext, ...rest } = activity
        return rest as TimelineEntry
      }
      return activity
    })
  }

  // Build list of activity pairs that need transport calculation
  const pairs: Array<{
    fromIndex: number
    toIndex: number
    fromActivity: TimelineEntry
    toActivity: TimelineEntry
  }> = []

  for (let i = 0; i < timeline.length - 1; i++) {
    pairs.push({
      fromIndex: i,
      toIndex: i + 1,
      fromActivity: timeline[i],
      toActivity: timeline[i + 1],
    })
  }

  const totalPairs = pairs.length
  let completedPairs = 0

  // Results map: fromIndex -> travelInfo
  const results = new Map<number, TravelInfo | null>()

  // Process in batches
  for (let i = 0; i < pairs.length; i += BATCH_SIZE) {
    const batch = pairs.slice(i, i + BATCH_SIZE)

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (pair) => {
        const travelInfo = await calculateTransportBetween(
          pair.fromActivity,
          pair.toActivity
        )
        return { fromIndex: pair.fromIndex, travelInfo }
      })
    )

    // Store results
    for (const result of batchResults) {
      results.set(result.fromIndex, result.travelInfo)
      completedPairs++
      onProgress?.(completedPairs, totalPairs)
    }

    // Delay between batches (except for last batch)
    if (i + BATCH_SIZE < pairs.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
    }
  }

  // Apply results to timeline
  return timeline.map((activity, index) => {
    // Last activity: never has travelToNext
    if (index === timeline.length - 1) {
      const { travelToNext, ...rest } = activity
      return rest as TimelineEntry
    }

    const travelInfo = results.get(index)

    if (travelInfo) {
      return { ...activity, travelToNext: travelInfo }
    }

    // If no new transport info calculated, remove existing if coordinates are missing
    const hasCoords = getActivityCoordinates(activity) !== null
    const nextHasCoords =
      index < timeline.length - 1 &&
      getActivityCoordinates(timeline[index + 1]) !== null

    if (!hasCoords || !nextHasCoords) {
      // Remove travelToNext if we can't calculate it
      const { travelToNext, ...rest } = activity
      return rest as TimelineEntry
    }

    // Keep existing travelToNext if it exists
    return activity
  })
}

/**
 * Update transport for a specific activity in the timeline
 *
 * Recalculates transport for:
 * - The previous activity (to this activity)
 * - This activity (to the next activity)
 *
 * Useful when a single activity is edited without recalculating the entire timeline
 */
export async function updateTransportForActivity(
  timeline: TimelineEntry[],
  activityIndex: number
): Promise<TimelineEntry[]> {
  const updatedTimeline = [...timeline]

  // Update transport from previous activity to this one
  if (activityIndex > 0) {
    const prevActivity = timeline[activityIndex - 1]
    const currentActivity = timeline[activityIndex]
    const travelInfo = await calculateTransportBetween(prevActivity, currentActivity)

    updatedTimeline[activityIndex - 1] = {
      ...prevActivity,
      travelToNext: travelInfo || undefined,
    }
  }

  // Update transport from this activity to next one
  if (activityIndex < timeline.length - 1) {
    const currentActivity = timeline[activityIndex]
    const nextActivity = timeline[activityIndex + 1]
    const travelInfo = await calculateTransportBetween(currentActivity, nextActivity)

    updatedTimeline[activityIndex] = {
      ...currentActivity,
      travelToNext: travelInfo || undefined,
    }
  }

  // Ensure last activity has no travelToNext
  if (activityIndex === timeline.length - 1 || updatedTimeline.length > 0) {
    const lastIndex = updatedTimeline.length - 1
    const { travelToNext, ...rest } = updatedTimeline[lastIndex]
    updatedTimeline[lastIndex] = rest as TimelineEntry
  }

  return updatedTimeline
}
