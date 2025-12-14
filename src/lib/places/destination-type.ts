/**
 * Destination Type Detection
 *
 * Analyzes a destination to determine its type (country, region, city, neighborhood)
 * and suggests appropriate search radius and multi-fetch strategies.
 */

import type { Coordinates } from "@/types/explore"

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || ""
const API_BASE = "https://places.googleapis.com/v1"

export type DestinationType = "country" | "region" | "city" | "neighborhood"

export interface DestinationAnalysis {
  type: DestinationType
  suggestedRadius: number // meters
  shouldMultiFetch: boolean
  mainCities?: Array<{
    name: string
    lat: number
    lng: number
  }>
}

// Google administrative levels that indicate destination scope
const ADMINISTRATIVE_TYPES = {
  country: ["country"],
  region: ["administrative_area_level_1", "administrative_area_level_2"],
  city: ["locality", "administrative_area_level_3"],
  neighborhood: ["sublocality", "neighborhood", "sublocality_level_1"],
}

// Radius suggestions based on destination type (in meters)
const RADIUS_BY_TYPE: Record<DestinationType, number> = {
  country: 50000, // 50km - still reasonable, multi-fetch handles coverage
  region: 50000, // 50km
  city: 25000, // 25km
  neighborhood: 10000, // 10km
}

// Well-known large cities that need larger radius
const LARGE_CITIES = [
  "roma",
  "rome",
  "paris",
  "london",
  "madrid",
  "barcelona",
  "milan",
  "milano",
  "new york",
  "los angeles",
  "tokyo",
  "berlin",
  "amsterdam",
  "vienna",
  "prague",
  "lisbon",
  "lisboa",
  "mexico city",
  "ciudad de mexico",
  "buenos aires",
  "sao paulo",
  "são paulo",
  "rio de janeiro",
  "bangkok",
  "singapore",
  "hong kong",
  "dubai",
  "istanbul",
  "cairo",
  "sydney",
  "melbourne",
]

/**
 * Get the types of a place from Google Places API
 */
async function getPlaceTypes(placeId: string): Promise<string[]> {
  if (!GOOGLE_PLACES_API_KEY) return []

  try {
    const response = await fetch(`${API_BASE}/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "types",
      },
    })

    if (!response.ok) return []

    const data = await response.json()
    return data.types || []
  } catch (error) {
    console.error("[destination-type] Error fetching place types:", error)
    return []
  }
}

/**
 * Check if a city name matches any known large city
 */
function isLargeCity(cityName: string): boolean {
  const normalized = cityName.toLowerCase().trim()
  return LARGE_CITIES.some(
    (city) => normalized.includes(city) || city.includes(normalized)
  )
}

/**
 * Analyze a destination to determine search strategy
 */
export async function analyzeDestination(
  placeId: string,
  destinationInfo: { name: string; fullName: string; country: string }
): Promise<DestinationAnalysis> {
  // Get types from Google Places API
  const types = await getPlaceTypes(placeId)

  console.log("[destination-type] Analyzing:", {
    name: destinationInfo.name,
    types,
  })

  // Detect type based on Google types
  let detectedType: DestinationType = "city" // default

  // Check for country
  if (types.some((t) => ADMINISTRATIVE_TYPES.country.includes(t))) {
    detectedType = "country"
  }
  // Check for region
  else if (types.some((t) => ADMINISTRATIVE_TYPES.region.includes(t))) {
    detectedType = "region"
  }
  // Check for neighborhood
  else if (types.some((t) => ADMINISTRATIVE_TYPES.neighborhood.includes(t))) {
    detectedType = "neighborhood"
  }
  // Check for city (locality)
  else if (types.some((t) => ADMINISTRATIVE_TYPES.city.includes(t))) {
    // Check if it's a large city that needs bigger radius
    if (isLargeCity(destinationInfo.name)) {
      return {
        type: "city",
        suggestedRadius: 35000, // 35km for large cities
        shouldMultiFetch: false,
      }
    }
    detectedType = "city"
  }

  // Determine if multi-fetch is needed
  const shouldMultiFetch = detectedType === "country" || detectedType === "region"

  return {
    type: detectedType,
    suggestedRadius: RADIUS_BY_TYPE[detectedType],
    shouldMultiFetch,
  }
}

/**
 * Get main tourist cities within a destination (country/region)
 * Used for multi-fetch strategy
 */
export async function getMainCitiesInDestination(
  destination: string,
  center: Coordinates,
  limit: number = 3
): Promise<Array<{ name: string; lat: number; lng: number }>> {
  if (!GOOGLE_PLACES_API_KEY) return []

  try {
    // Search for main tourist cities
    const response = await fetch(`${API_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.location",
      },
      body: JSON.stringify({
        textQuery: `principales ciudades turísticas de ${destination}`,
        maxResultCount: limit,
        languageCode: "es",
      }),
    })

    if (!response.ok) {
      console.error("[destination-type] Error fetching cities:", await response.text())
      return []
    }

    const data = await response.json()

    if (!data.places || data.places.length === 0) {
      // Fallback: just use the center point
      return [{ name: destination, lat: center.lat, lng: center.lng }]
    }

    return data.places.map(
      (p: {
        displayName?: { text: string }
        location?: { latitude: number; longitude: number }
      }) => ({
        name: p.displayName?.text || destination,
        lat: p.location?.latitude || center.lat,
        lng: p.location?.longitude || center.lng,
      })
    )
  } catch (error) {
    console.error("[destination-type] Error fetching cities:", error)
    return [{ name: destination, lat: center.lat, lng: center.lng }]
  }
}

/**
 * Combine and deduplicate results from multiple city searches
 * Removes duplicates based on place ID
 */
export function combineAndDeduplicateResults<T extends { id: string }>(
  results: T[][],
  categoriesCount: number
): Map<string, T[]> {
  const combined = new Map<string, T[]>()
  const seenIds = new Set<string>()

  // results is a flat array, need to reorganize by category
  // Each city contributes categoriesCount arrays
  const citiesCount = results.length / categoriesCount

  for (let catIdx = 0; catIdx < categoriesCount; catIdx++) {
    const categoryPlaces: T[] = []

    for (let cityIdx = 0; cityIdx < citiesCount; cityIdx++) {
      const resultIdx = cityIdx * categoriesCount + catIdx
      const places = results[resultIdx] || []

      for (const place of places) {
        if (!seenIds.has(place.id)) {
          seenIds.add(place.id)
          categoryPlaces.push(place)
        }
      }
    }

    combined.set(`category-${catIdx}`, categoryPlaces)
  }

  return combined
}
