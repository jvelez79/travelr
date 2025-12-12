/**
 * Google Places API Client
 *
 * Uses the Google Places API (New) for:
 * - Text Search: Find places by category in a destination
 * - Place Details: Get detailed info about a specific place
 * - Place Photos: Get photo URLs
 */

import type { Place, PlaceCategory, Coordinates } from "@/types/explore"

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || ""
const API_BASE = "https://places.googleapis.com/v1"

// Map our categories to Google Places types
const CATEGORY_TO_GOOGLE_TYPES: Record<PlaceCategory, string[]> = {
  restaurants: ["restaurant", "meal_takeaway", "meal_delivery"],
  attractions: ["tourist_attraction", "amusement_park", "zoo", "aquarium"],
  cafes: ["cafe", "bakery", "coffee_shop"],
  bars: ["bar", "night_club", "wine_bar"],
  museums: ["museum", "art_gallery"],
  nature: ["park", "natural_feature", "campground", "hiking_area"],
}

// Map Google price levels to our format
function mapPriceLevel(priceLevel?: string): 1 | 2 | 3 | 4 | undefined {
  const mapping: Record<string, 1 | 2 | 3 | 4> = {
    PRICE_LEVEL_FREE: 1,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  }
  return priceLevel ? mapping[priceLevel] : undefined
}

// Get photo URL from photo reference
export function getPhotoUrl(photoName: string, maxWidth: number = 800): string {
  if (!GOOGLE_PLACES_API_KEY) return ""
  return `${API_BASE}/${photoName}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_PLACES_API_KEY}`
}

interface GooglePlace {
  id: string
  displayName: { text: string; languageCode: string }
  primaryType?: string
  primaryTypeDisplayName?: { text: string }
  formattedAddress?: string
  location?: { latitude: number; longitude: number }
  rating?: number
  userRatingCount?: number
  priceLevel?: string
  photos?: Array<{ name: string }>
  shortFormattedAddress?: string
  addressComponents?: Array<{
    longText: string
    shortText: string
    types: string[]
  }>
  editorialSummary?: { text: string }
}

interface TextSearchResponse {
  places?: GooglePlace[]
  nextPageToken?: string
}

interface PlaceDetailsResponse extends GooglePlace {}

/**
 * Search for places by category in a destination
 */
export async function searchPlaces(
  query: string,
  category: PlaceCategory,
  location: Coordinates,
  radiusMeters: number = 10000
): Promise<Place[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("Google Places API key not configured")
    return []
  }

  const includedTypes = CATEGORY_TO_GOOGLE_TYPES[category]

  try {
    const response = await fetch(`${API_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": [
          "places.id",
          "places.displayName",
          "places.primaryType",
          "places.primaryTypeDisplayName",
          "places.formattedAddress",
          "places.shortFormattedAddress",
          "places.location",
          "places.rating",
          "places.userRatingCount",
          "places.priceLevel",
          "places.photos",
          "places.addressComponents",
          "places.editorialSummary",
        ].join(","),
      },
      body: JSON.stringify({
        textQuery: query,
        includedType: includedTypes[0], // Use primary type
        locationBias: {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng,
            },
            radius: radiusMeters,
          },
        },
        languageCode: "es",
        maxResultCount: 20,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Google Places API error:", error)
      return []
    }

    const data: TextSearchResponse = await response.json()

    if (!data.places) {
      return []
    }

    return data.places.map((place) => transformGooglePlace(place, category))
  } catch (error) {
    console.error("Error searching places:", error)
    return []
  }
}

/**
 * Search places by category only (simpler query)
 */
export async function searchPlacesByCategory(
  destination: string,
  category: PlaceCategory,
  location: Coordinates,
  radiusMeters: number = 15000
): Promise<Place[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("Google Places API key not configured")
    return []
  }

  const categoryQueries: Record<PlaceCategory, string> = {
    restaurants: `mejores restaurantes en ${destination}`,
    attractions: `atracciones turísticas en ${destination}`,
    cafes: `cafeterías en ${destination}`,
    bars: `bares en ${destination}`,
    museums: `museos en ${destination}`,
    nature: `parques naturales cerca de ${destination}`,
  }

  return searchPlaces(categoryQueries[category], category, location, radiusMeters)
}

/**
 * Get details for a specific place
 */
export async function getPlaceDetails(placeId: string): Promise<Place | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("Google Places API key not configured")
    return null
  }

  try {
    const response = await fetch(`${API_BASE}/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": [
          "id",
          "displayName",
          "primaryType",
          "primaryTypeDisplayName",
          "formattedAddress",
          "shortFormattedAddress",
          "location",
          "rating",
          "userRatingCount",
          "priceLevel",
          "photos",
          "addressComponents",
          "regularOpeningHours",
          "websiteUri",
          "internationalPhoneNumber",
          "editorialSummary",
        ].join(","),
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Google Places API error:", error)
      return null
    }

    const data: PlaceDetailsResponse = await response.json()

    // Infer category from primary type
    const category = inferCategory(data.primaryType)

    return transformGooglePlace(data, category)
  } catch (error) {
    console.error("Error getting place details:", error)
    return null
  }
}

/**
 * Get autocomplete suggestions for destinations
 */
export async function autocompleteDestination(
  input: string
): Promise<Array<{ placeId: string; description: string; mainText: string }>> {
  if (!GOOGLE_PLACES_API_KEY || input.length < 2) {
    return []
  }

  try {
    const response = await fetch(`${API_BASE}/places:autocomplete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
      },
      body: JSON.stringify({
        input,
        includedPrimaryTypes: ["locality", "administrative_area_level_1", "country"],
        languageCode: "es",
      }),
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()

    return (data.suggestions || []).map((suggestion: {
      placePrediction: {
        placeId: string
        text: { text: string }
        structuredFormat: { mainText: { text: string } }
      }
    }) => ({
      placeId: suggestion.placePrediction.placeId,
      description: suggestion.placePrediction.text.text,
      mainText: suggestion.placePrediction.structuredFormat.mainText.text,
    }))
  } catch (error) {
    console.error("Error in autocomplete:", error)
    return []
  }
}

/**
 * Get destination info from place ID
 */
export async function getDestinationInfo(placeId: string): Promise<{
  name: string
  fullName: string
  country: string
  location: Coordinates
} | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    return null
  }

  try {
    const response = await fetch(`${API_BASE}/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "displayName,formattedAddress,location,addressComponents",
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    const country = data.addressComponents?.find(
      (c: { types: string[] }) => c.types.includes("country")
    )?.longText || ""

    return {
      name: data.displayName?.text || "",
      fullName: data.formattedAddress || "",
      country,
      location: {
        lat: data.location?.latitude || 0,
        lng: data.location?.longitude || 0,
      },
    }
  } catch (error) {
    console.error("Error getting destination info:", error)
    return null
  }
}

/**
 * Search for nearby destinations (cities, tourist areas) around a location
 */
export async function searchNearbyDestinations(
  location: Coordinates,
  radiusMeters: number = 100000
): Promise<Array<{
  placeId: string
  name: string
  fullName: string
  location: Coordinates
}>> {
  if (!GOOGLE_PLACES_API_KEY) {
    return []
  }

  try {
    const response = await fetch(`${API_BASE}/places:searchNearby`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.types",
      },
      body: JSON.stringify({
        includedTypes: ["locality", "tourist_attraction"],
        locationRestriction: {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng,
            },
            radius: radiusMeters,
          },
        },
        maxResultCount: 10,
        rankPreference: "DISTANCE",
      }),
    })

    if (!response.ok) {
      console.error("Google Places API error:", await response.text())
      return []
    }

    const data = await response.json()

    if (!data.places) {
      return []
    }

    return data.places
      .filter((place: { types?: string[] }) =>
        place.types?.includes("locality") || place.types?.includes("tourist_attraction")
      )
      .map((place: {
        id: string
        displayName?: { text: string }
        formattedAddress?: string
        location?: { latitude: number; longitude: number }
      }) => ({
        placeId: place.id,
        name: place.displayName?.text || "",
        fullName: place.formattedAddress || "",
        location: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0,
        },
      }))
  } catch (error) {
    console.error("Error searching nearby destinations:", error)
    return []
  }
}

// Transform Google Place to our Place type
function transformGooglePlace(place: GooglePlace, category: PlaceCategory): Place {
  const city = place.addressComponents?.find(
    (c) => c.types?.includes("locality") || c.types?.includes("administrative_area_level_2")
  )?.longText || ""

  const country = place.addressComponents?.find(
    (c) => c.types?.includes("country")
  )?.longText || ""

  return {
    id: place.id,
    name: place.displayName?.text || "",
    category,
    subcategory: place.primaryTypeDisplayName?.text,
    description: place.editorialSummary?.text,
    location: {
      lat: place.location?.latitude || 0,
      lng: place.location?.longitude || 0,
      address: place.shortFormattedAddress || place.formattedAddress,
      city,
      country,
    },
    rating: place.rating,
    reviewCount: place.userRatingCount,
    priceLevel: mapPriceLevel(place.priceLevel),
    images: (place.photos || []).slice(0, 5).map((photo) => getPhotoUrl(photo.name)),
    openingHours: undefined,
    source: "google",
    sourceId: place.id,
  }
}

// Infer category from Google place type
function inferCategory(primaryType?: string): PlaceCategory {
  if (!primaryType) return "attractions"

  for (const [category, types] of Object.entries(CATEGORY_TO_GOOGLE_TYPES)) {
    if (types.some((t) => primaryType.toLowerCase().includes(t.replace("_", "")))) {
      return category as PlaceCategory
    }
  }

  return "attractions"
}
