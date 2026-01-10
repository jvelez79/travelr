/**
 * Google Distance Matrix API Client
 *
 * Calculates travel time and distance between two locations.
 * Uses the Distance Matrix API for accurate route-based calculations.
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_PLACES_API_KEY || ""
const API_BASE = "https://maps.googleapis.com/maps/api/distancematrix/json"

export interface Coordinates {
  lat: number
  lng: number
}

export interface LocationInput {
  lat?: number
  lng?: number
  placeId?: string
}

export type TravelMode = 'driving' | 'walking' | 'transit' | 'bicycling'

export interface TravelTimeResult {
  duration: number // seconds
  distance: number // meters
  durationText: string
  distanceText: string
}

interface DistanceMatrixResponse {
  rows?: Array<{
    elements?: Array<{
      status: string
      duration?: { value: number; text: string }
      distance?: { value: number; text: string }
    }>
  }>
  status: string
  error_message?: string
}

/**
 * Calculate travel time and distance between two locations
 *
 * @param origin - Starting location (coordinates or placeId)
 * @param destination - Ending location (coordinates or placeId)
 * @param mode - Travel mode (driving, walking, transit, bicycling)
 * @returns Travel time and distance information
 */
export async function calculateTravelTime(
  origin: LocationInput,
  destination: LocationInput,
  mode: TravelMode = 'driving'
): Promise<TravelTimeResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API key not configured")
    return null
  }

  try {
    // Build origin parameter (prefer placeId over coordinates)
    const originParam = origin.placeId
      ? `place_id:${origin.placeId}`
      : origin.lat && origin.lng
      ? `${origin.lat},${origin.lng}`
      : null

    const destinationParam = destination.placeId
      ? `place_id:${destination.placeId}`
      : destination.lat && destination.lng
      ? `${destination.lat},${destination.lng}`
      : null

    if (!originParam || !destinationParam) {
      console.error("[calculateTravelTime] Invalid origin or destination")
      return null
    }

    // Build request URL
    const params = new URLSearchParams({
      origins: originParam,
      destinations: destinationParam,
      mode: mode,
      key: GOOGLE_MAPS_API_KEY,
      language: 'es',
    })

    const url = `${API_BASE}?${params.toString()}`

    const response = await fetch(url)

    if (!response.ok) {
      console.error("[calculateTravelTime] HTTP error:", response.status)
      return null
    }

    const data: DistanceMatrixResponse = await response.json()

    // Check API status
    if (data.status !== 'OK') {
      console.error("[calculateTravelTime] API error:", data.status, data.error_message)
      return null
    }

    // Extract first (and only) result
    const element = data.rows?.[0]?.elements?.[0]

    if (!element || element.status !== 'OK') {
      console.error("[calculateTravelTime] No valid route found:", element?.status)
      return null
    }

    if (!element.duration || !element.distance) {
      console.error("[calculateTravelTime] Missing duration or distance data")
      return null
    }

    return {
      duration: element.duration.value,
      distance: element.distance.value,
      durationText: element.duration.text,
      distanceText: element.distance.text,
    }
  } catch (error) {
    console.error("[calculateTravelTime] Error:", error)
    return null
  }
}

/**
 * Calculate travel time between multiple origin-destination pairs
 *
 * @param origins - Array of origin locations
 * @param destinations - Array of destination locations
 * @param mode - Travel mode
 * @returns Matrix of travel times (origins x destinations)
 */
export async function calculateTravelTimeMatrix(
  origins: LocationInput[],
  destinations: LocationInput[],
  mode: TravelMode = 'driving'
): Promise<(TravelTimeResult | null)[][] | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API key not configured")
    return null
  }

  try {
    // Build origin and destination parameters
    const originParams = origins.map(loc =>
      loc.placeId
        ? `place_id:${loc.placeId}`
        : loc.lat && loc.lng
        ? `${loc.lat},${loc.lng}`
        : null
    ).filter(Boolean)

    const destinationParams = destinations.map(loc =>
      loc.placeId
        ? `place_id:${loc.placeId}`
        : loc.lat && loc.lng
        ? `${loc.lat},${loc.lng}`
        : null
    ).filter(Boolean)

    if (originParams.length === 0 || destinationParams.length === 0) {
      console.error("[calculateTravelTimeMatrix] Invalid origins or destinations")
      return null
    }

    // Build request URL
    const params = new URLSearchParams({
      origins: originParams.join('|'),
      destinations: destinationParams.join('|'),
      mode: mode,
      key: GOOGLE_MAPS_API_KEY,
      language: 'es',
    })

    const url = `${API_BASE}?${params.toString()}`

    const response = await fetch(url)

    if (!response.ok) {
      console.error("[calculateTravelTimeMatrix] HTTP error:", response.status)
      return null
    }

    const data: DistanceMatrixResponse = await response.json()

    // Check API status
    if (data.status !== 'OK') {
      console.error("[calculateTravelTimeMatrix] API error:", data.status, data.error_message)
      return null
    }

    // Parse results into matrix
    const matrix: (TravelTimeResult | null)[][] = []

    data.rows?.forEach(row => {
      const rowResults: (TravelTimeResult | null)[] = []

      row.elements?.forEach(element => {
        if (element.status === 'OK' && element.duration && element.distance) {
          rowResults.push({
            duration: element.duration.value,
            distance: element.distance.value,
            durationText: element.duration.text,
            distanceText: element.distance.text,
          })
        } else {
          rowResults.push(null)
        }
      })

      matrix.push(rowResults)
    })

    return matrix
  } catch (error) {
    console.error("[calculateTravelTimeMatrix] Error:", error)
    return null
  }
}
