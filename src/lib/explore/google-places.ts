/**
 * Google Places API Client
 *
 * Uses the Google Places API (New) for:
 * - Text Search: Find places by category in a destination
 * - Place Details: Get detailed info about a specific place
 * - Place Photos: Get photo URLs
 */

import type { Place, PlaceCategory, Coordinates, AccessibilityOptions, ServingOptions } from "@/types/explore"

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || ""
const API_BASE = "https://places.googleapis.com/v1"

// Map our categories to Google Places types (expanded based on Google Places Table A)
const CATEGORY_TO_GOOGLE_TYPES: Record<PlaceCategory, string[]> = {
  // Expanded: 38 restaurant types for better subcategory inference
  restaurants: [
    "restaurant",
    "meal_takeaway",
    "meal_delivery",
    // By cuisine type
    "american_restaurant",
    "asian_restaurant",
    "brazilian_restaurant",
    "chinese_restaurant",
    "french_restaurant",
    "greek_restaurant",
    "indian_restaurant",
    "indonesian_restaurant",
    "italian_restaurant",
    "japanese_restaurant",
    "korean_restaurant",
    "lebanese_restaurant",
    "mediterranean_restaurant",
    "mexican_restaurant",
    "middle_eastern_restaurant",
    "seafood_restaurant",
    "spanish_restaurant",
    "thai_restaurant",
    "turkish_restaurant",
    "vietnamese_restaurant",
    // By style
    "fine_dining_restaurant",
    "fast_food_restaurant",
    "buffet_restaurant",
    "breakfast_restaurant",
    "brunch_restaurant",
    // Specialized
    "barbecue_restaurant",
    "hamburger_restaurant",
    "pizza_restaurant",
    "ramen_restaurant",
    "sushi_restaurant",
    "steak_house",
    "sandwich_shop",
    // Dietary
    "vegan_restaurant",
    "vegetarian_restaurant",
  ],
  attractions: ["tourist_attraction", "amusement_park", "zoo", "aquarium"],
  cafes: ["cafe", "bakery", "coffee_shop"],
  bars: ["bar", "night_club", "wine_bar"],
  museums: ["museum", "art_gallery"],
  // Expanded: 9 nature types
  nature: [
    "park",
    "natural_feature",
    "campground",
    "hiking_area",
    "botanical_garden",
    "national_park",
    "state_park",
    "wildlife_park",
    "wildlife_refuge",
    "garden",
    "picnic_ground",
    "dog_park",
  ],
  landmarks: ["point_of_interest", "town_square", "historical_landmark"],
  beaches: ["beach", "natural_feature"],
  religious: ["church", "mosque", "synagogue", "hindu_temple", "place_of_worship"],
  markets: ["market", "shopping_mall", "supermarket"],
  viewpoints: ["observation_deck", "scenic_spot", "viewpoint"],
  // New: wellness category
  wellness: [
    "spa",
    "sauna",
    "wellness_center",
    "yoga_studio",
    "massage",
    "skin_care_clinic",
    "tanning_studio",
  ],
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
function getPhotoUrl(photoName: string, maxWidth: number = 800): string {
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
  // Opening hours and contact
  regularOpeningHours?: {
    weekdayDescriptions?: string[]
    openNow?: boolean
  }
  websiteUri?: string
  internationalPhoneNumber?: string
  nationalPhoneNumber?: string
  // Accessibility options
  accessibilityOptions?: {
    wheelchairAccessibleParking?: boolean
    wheelchairAccessibleEntrance?: boolean
    wheelchairAccessibleRestroom?: boolean
    wheelchairAccessibleSeating?: boolean
  }
  // Serving options (for restaurants, cafes, bars)
  servesBeer?: boolean
  servesWine?: boolean
  servesCocktails?: boolean
  servesCoffee?: boolean
  servesDessert?: boolean
  servesVegetarianFood?: boolean
}

interface TextSearchResponse {
  places?: GooglePlace[]
  nextPageToken?: string
}

interface PlaceDetailsResponse extends GooglePlace {}

// Result type that includes pagination info
export interface PlacesSearchResult {
  places: Place[]
  nextPageToken?: string
}

// Common field mask for place searches
const PLACES_FIELD_MASK = [
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
  "places.accessibilityOptions",
  "places.servesBeer",
  "places.servesWine",
  "places.servesCocktails",
  "places.servesCoffee",
  "places.servesDessert",
  "places.servesVegetarianFood",
  "nextPageToken",
].join(",")

/**
 * Search for places by category in a destination
 */
async function searchPlaces(
  query: string,
  category: PlaceCategory,
  location: Coordinates,
  radiusMeters: number = 10000,
  pageToken?: string
): Promise<PlacesSearchResult> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("Google Places API key not configured")
    return { places: [] }
  }

  const includedTypes = CATEGORY_TO_GOOGLE_TYPES[category]

  try {
    const requestBody: Record<string, unknown> = {
      textQuery: query,
      includedType: includedTypes[0],
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
    }

    if (pageToken) {
      requestBody.pageToken = pageToken
    }

    const response = await fetch(`${API_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": PLACES_FIELD_MASK,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Google Places API error:", error)
      return { places: [] }
    }

    const data: TextSearchResponse = await response.json()

    if (!data.places) {
      return { places: [], nextPageToken: data.nextPageToken }
    }

    return {
      places: data.places.map((place) => transformGooglePlace(place, category)),
      nextPageToken: data.nextPageToken,
    }
  } catch (error) {
    console.error("Error searching places:", error)
    return { places: [] }
  }
}

/**
 * Search places by category only (simpler query)
 */
export async function searchPlacesByCategory(
  destination: string,
  category: PlaceCategory,
  location: Coordinates,
  radiusMeters: number = 15000,
  pageToken?: string
): Promise<PlacesSearchResult> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("Google Places API key not configured")
    return { places: [] }
  }

  const categoryQueries: Record<PlaceCategory, string> = {
    restaurants: `mejores restaurantes en ${destination}`,
    attractions: `atracciones turísticas en ${destination}`,
    cafes: `cafeterías en ${destination}`,
    bars: `bares en ${destination}`,
    museums: `museos en ${destination}`,
    nature: `parques naturales cerca de ${destination}`,
    landmarks: `plazas y monumentos históricos en ${destination}`,
    beaches: `playas en ${destination}`,
    religious: `iglesias catedrales y templos en ${destination}`,
    markets: `mercados en ${destination}`,
    viewpoints: `miradores y vistas panorámicas en ${destination}`,
    wellness: `spas y centros de bienestar en ${destination}`,
  }

  return searchPlaces(categoryQueries[category], category, location, radiusMeters, pageToken)
}

/**
 * Search places by text query (for search bar)
 */
export async function searchPlacesByText(
  query: string,
  destination: string,
  location: Coordinates,
  radiusMeters: number = 15000
): Promise<PlacesSearchResult> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("Google Places API key not configured")
    return { places: [] }
  }

  try {
    const response = await fetch(`${API_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": PLACES_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: `${query} en ${destination}`,
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
      return { places: [] }
    }

    const data: TextSearchResponse = await response.json()

    if (!data.places) {
      return { places: [] }
    }

    // Infer category for each place
    return {
      places: data.places.map((place) => {
        const category = inferCategory(place.primaryType)
        return transformGooglePlace(place, category)
      }),
    }
  } catch (error) {
    console.error("Error searching places by text:", error)
    return { places: [] }
  }
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
          "nationalPhoneNumber",
          "editorialSummary",
          // Accessibility
          "accessibilityOptions",
          // Serving options
          "servesBeer",
          "servesWine",
          "servesCocktails",
          "servesCoffee",
          "servesDessert",
          "servesVegetarianFood",
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
 * Get photos for a specific place (for lazy loading)
 * Only fetches photos field to minimize API cost
 */
export async function getPlacePhotos(placeId: string): Promise<string[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("Google Places API key not configured")
    return []
  }

  try {
    const response = await fetch(`${API_BASE}/places/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "photos",
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Google Places API error fetching photos:", error)
      return []
    }

    const data = await response.json()

    if (!data.photos || data.photos.length === 0) {
      return []
    }

    // Convert photo references to URLs (max 10)
    return data.photos
      .slice(0, 10)
      .map((photo: { name: string }) => getPhotoUrl(photo.name))
  } catch (error) {
    console.error("Error getting place photos:", error)
    return []
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
  // DEBUG: Log how many photos Google returns
  console.log(`[PHOTOS DEBUG] ${place.displayName?.text}: ${place.photos?.length || 0} fotos de Google`)

  const city = place.addressComponents?.find(
    (c) => c.types?.includes("locality") || c.types?.includes("administrative_area_level_2")
  )?.longText || ""

  const country = place.addressComponents?.find(
    (c) => c.types?.includes("country")
  )?.longText || ""

  // Build accessibility options if any exist
  const accessibility: AccessibilityOptions | undefined = place.accessibilityOptions ? {
    wheelchairAccessibleParking: place.accessibilityOptions.wheelchairAccessibleParking,
    wheelchairAccessibleEntrance: place.accessibilityOptions.wheelchairAccessibleEntrance,
    wheelchairAccessibleRestroom: place.accessibilityOptions.wheelchairAccessibleRestroom,
    wheelchairAccessibleSeating: place.accessibilityOptions.wheelchairAccessibleSeating,
  } : undefined

  // Build serving options if any exist
  const hasServingOptions = place.servesBeer !== undefined ||
    place.servesWine !== undefined ||
    place.servesCocktails !== undefined ||
    place.servesCoffee !== undefined ||
    place.servesDessert !== undefined ||
    place.servesVegetarianFood !== undefined

  const servingOptions: ServingOptions | undefined = hasServingOptions ? {
    servesBeer: place.servesBeer,
    servesWine: place.servesWine,
    servesCocktails: place.servesCocktails,
    servesCoffee: place.servesCoffee,
    servesDessert: place.servesDessert,
    servesVegetarianFood: place.servesVegetarianFood,
  } : undefined

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
    images: (place.photos || []).slice(0, 10).map((photo) => getPhotoUrl(photo.name)),
    openingHours: place.regularOpeningHours?.weekdayDescriptions,
    openNow: place.regularOpeningHours?.openNow,
    phone: place.internationalPhoneNumber,
    website: place.websiteUri,
    accessibility,
    servingOptions,
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

/**
 * Simple search for places by destination name and Google type
 * Uses text search without requiring coordinates (for Explore page)
 */
export async function searchPlacesByDestinationAndType(
  destination: string,
  googleType: string,
  maxResults: number = 20
): Promise<Place[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("Google Places API key not configured")
    return []
  }

  try {
    // Build a search query combining destination and type
    const query = `${googleType.replace(/_/g, " ")} in ${destination}`

    const response = await fetch(`${API_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": PLACES_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "es",
        maxResultCount: maxResults,
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

    // Transform to our Place type and infer category
    return data.places.map((place) => {
      const category = inferCategory(place.primaryTypeDisplayName?.text || googleType)
      return transformGooglePlace(place, category)
    })
  } catch (error) {
    console.error("Error searching places:", error)
    return []
  }
}
