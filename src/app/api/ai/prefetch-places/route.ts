import { NextRequest, NextResponse } from "next/server"
import {
  searchPlacesByCategory,
  autocompleteDestination,
  getDestinationInfo,
  type PlacesSearchResult,
} from "@/lib/explore/google-places"
import { sortByOverallQuality } from "@/lib/places/scoring"
import {
  analyzeDestination,
  getMainCitiesInDestination,
} from "@/lib/places/destination-type"
import type { PlaceCategory, Place, Coordinates } from "@/types/explore"

// Cache for 1 hour
export const revalidate = 3600

// Base categories to always prefetch
const BASE_CATEGORIES: PlaceCategory[] = [
  "restaurants",
  "attractions",
  "cafes",
  "museums",
  "nature",
  "landmarks",
  "viewpoints",  // Miradores - incluido siempre porque existen en casi todos los destinos turísticos
]

// Extended categories added based on destination
const EXTENDED_CATEGORIES: Record<string, PlaceCategory[]> = {
  beaches: ["beaches"],
  religious: ["religious"],
  markets: ["markets"],
  nightlife: ["bars"],
}

// Destinations known for beaches
const BEACH_DESTINATIONS = [
  "cancun", "miami", "bali", "phuket", "barcelona", "hawaii", "maldivas",
  "caribe", "caribbean", "costa rica", "puerto rico", "rio", "copacabana",
  "ibiza", "mallorca", "santorini", "mykonos", "cabo", "acapulco",
]

// European countries known for religious sites
const RELIGIOUS_DESTINATIONS = [
  "italia", "italy", "spain", "españa", "france", "francia", "portugal",
  "grecia", "greece", "vaticano", "vatican", "roma", "rome", "florence",
  "florencia", "sevilla", "toledo", "jerusalem", "israel",
]

// Destinations known for markets
const MARKET_DESTINATIONS = [
  "marrakech", "morocco", "marruecos", "istanbul", "bangkok", "tokyo",
  "mexico", "oaxaca", "peru", "lima", "india", "vietnam", "hanoi",
]

/**
 * Get categories to prefetch based on destination
 */
function getCategoriesForDestination(
  destinationInfo: { name: string; fullName: string; country: string }
): PlaceCategory[] {
  const categories = [...BASE_CATEGORIES]
  const destLower = `${destinationInfo.name} ${destinationInfo.country}`.toLowerCase()

  // Add beaches for beach destinations
  if (BEACH_DESTINATIONS.some(d => destLower.includes(d))) {
    categories.push("beaches")
  }

  // Add religious sites for European/religious destinations
  if (RELIGIOUS_DESTINATIONS.some(d => destLower.includes(d))) {
    categories.push("religious")
  }

  // Add markets for market-famous destinations
  if (MARKET_DESTINATIONS.some(d => destLower.includes(d))) {
    categories.push("markets")
  }

  // Always include bars for nightlife
  if (!categories.includes("bars")) {
    categories.push("bars")
  }

  return categories
}

// Simplified place for AI prompts (smaller payload)
interface PlaceForAI {
  id: string
  name: string
  type: string
  rating?: number
  priceLevel?: string
  location: string
}

// Full prefetched places response
export interface PrefetchedPlaces {
  restaurants: Place[]
  attractions: Place[]
  cafes: Place[]
  bars: Place[]
  museums: Place[]
  nature: Place[]
  landmarks: Place[]
  beaches: Place[]
  religious: Place[]
  markets: Place[]
  viewpoints: Place[]
  wellness: Place[]
}

interface PrefetchRequest {
  destination: string
}

interface PrefetchResponse {
  placesForAI: Record<PlaceCategory, PlaceForAI[]>
  fullPlaces: PrefetchedPlaces
  coordinates: Coordinates
  destinationInfo: {
    name: string
    fullName: string
    country: string
  }
}

/**
 * POST /api/ai/prefetch-places
 *
 * Pre-fetches places from Google Places API for all categories in parallel.
 * Used during assisted itinerary generation to provide real places to the AI.
 *
 * Body: { destination: string }
 * Response: { placesForAI, fullPlaces, coordinates, destinationInfo }
 */
export async function POST(request: NextRequest) {
  try {
    const body: PrefetchRequest = await request.json()
    const { destination } = body

    if (!destination) {
      return NextResponse.json(
        { error: "Missing required parameter: destination" },
        { status: 400 }
      )
    }

    // Step 1: Get destination coordinates
    // First try autocomplete to get a placeId
    const suggestions = await autocompleteDestination(destination)

    let coordinates: Coordinates
    let destinationInfo: { name: string; fullName: string; country: string }

    if (suggestions.length > 0) {
      const info = await getDestinationInfo(suggestions[0].placeId)
      if (info) {
        coordinates = info.location
        destinationInfo = {
          name: info.name,
          fullName: info.fullName,
          country: info.country,
        }
      } else {
        return NextResponse.json(
          { error: "Could not get destination info" },
          { status: 404 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "Destination not found" },
        { status: 404 }
      )
    }

    // Step 2: Analyze destination type and determine search strategy
    const analysis = await analyzeDestination(
      suggestions[0].placeId,
      destinationInfo
    )

    // Get dynamic categories based on destination
    const categories = getCategoriesForDestination(destinationInfo)

    console.log('[LINKEO DEBUG] Análisis de destino:', {
      destination,
      type: analysis.type,
      suggestedRadius: analysis.suggestedRadius,
      shouldMultiFetch: analysis.shouldMultiFetch,
      categories: categories,
    })

    // Step 3: Search places based on destination type
    const combinedByCategory: Record<string, Place[]> = {}

    if (analysis.shouldMultiFetch) {
      // For countries/regions: search from multiple cities
      const mainCities = await getMainCitiesInDestination(
        destination,
        coordinates,
        3 // Get up to 3 main cities
      )

      console.log('[LINKEO DEBUG] Multi-fetch desde ciudades:', mainCities.map(c => c.name))

      // Search from each city in parallel
      const allSearchPromises: Promise<PlacesSearchResult>[] = []

      for (const city of mainCities) {
        for (const category of categories) {
          allSearchPromises.push(
            searchPlacesByCategory(
              city.name,
              category,
              { lat: city.lat, lng: city.lng },
              analysis.suggestedRadius
            )
          )
        }
      }

      const allResults = await Promise.all(allSearchPromises)

      // Combine and deduplicate results
      const seenIds = new Set<string>()

      for (let catIdx = 0; catIdx < categories.length; catIdx++) {
        const categoryPlaces: Place[] = []

        for (let cityIdx = 0; cityIdx < mainCities.length; cityIdx++) {
          const resultIdx = cityIdx * categories.length + catIdx
          const places = allResults[resultIdx]?.places || []

          for (const place of places) {
            if (!seenIds.has(place.id)) {
              seenIds.add(place.id)
              categoryPlaces.push(place)
            }
          }
        }

        combinedByCategory[categories[catIdx]] = categoryPlaces
      }
    } else {
      // Single-fetch for cities/neighborhoods
      const searchPromises = categories.map((category) =>
        searchPlacesByCategory(
          destination,
          category,
          coordinates,
          analysis.suggestedRadius
        )
      )

      const results = await Promise.all(searchPromises)

      categories.forEach((category, idx) => {
        combinedByCategory[category] = results[idx]?.places || []
      })
    }

    // Build fullPlaces with all categories (empty arrays for unused ones)
    const fullPlaces: PrefetchedPlaces = {
      restaurants: combinedByCategory.restaurants || [],
      attractions: combinedByCategory.attractions || [],
      cafes: combinedByCategory.cafes || [],
      bars: combinedByCategory.bars || [],
      museums: combinedByCategory.museums || [],
      nature: combinedByCategory.nature || [],
      landmarks: combinedByCategory.landmarks || [],
      beaches: combinedByCategory.beaches || [],
      religious: combinedByCategory.religious || [],
      markets: combinedByCategory.markets || [],
      viewpoints: combinedByCategory.viewpoints || [],
      wellness: combinedByCategory.wellness || [],
    }

    // DEBUG: Log prefetched places stats
    console.log('[LINKEO DEBUG] Pre-fetch completado:', {
      destination: destination,
      resolvedCoordinates: coordinates,
      destinationInfo: destinationInfo,
      categoriesUsed: categories,
      placesByCategory: Object.fromEntries(
        Object.entries(fullPlaces).map(([cat, places]) => [cat, places.length])
      ),
      totalPlaces: Object.values(fullPlaces).reduce((sum, arr) => sum + arr.length, 0),
      sampleAttractions: fullPlaces.attractions.slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        address: p.location?.address
      }))
    })

    // Step 4: Create simplified version for AI prompts (max 25 per category)
    const placesForAI: Record<PlaceCategory, PlaceForAI[]> = {
      restaurants: simplifyPlaces(fullPlaces.restaurants, 25),
      attractions: simplifyPlaces(fullPlaces.attractions, 25),
      cafes: simplifyPlaces(fullPlaces.cafes, 25),
      bars: simplifyPlaces(fullPlaces.bars, 25),
      museums: simplifyPlaces(fullPlaces.museums, 25),
      nature: simplifyPlaces(fullPlaces.nature, 25),
      landmarks: simplifyPlaces(fullPlaces.landmarks, 25),
      beaches: simplifyPlaces(fullPlaces.beaches, 25),
      religious: simplifyPlaces(fullPlaces.religious, 25),
      markets: simplifyPlaces(fullPlaces.markets, 25),
      viewpoints: simplifyPlaces(fullPlaces.viewpoints, 25),
      wellness: simplifyPlaces(fullPlaces.wellness, 25),
    }

    const response: PrefetchResponse = {
      placesForAI,
      fullPlaces,
      coordinates,
      destinationInfo,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[prefetch-places] Error:", error)
    return NextResponse.json(
      { error: "Failed to prefetch places" },
      { status: 500 }
    )
  }
}

/**
 * Simplify places for AI prompts - reduce payload size
 * Sorts by overall quality first to ensure best places are included
 */
function simplifyPlaces(places: Place[], limit: number): PlaceForAI[] {
  // Sort by quality (rating × reviewCount) before limiting
  const sortedPlaces = sortByOverallQuality(places)

  return sortedPlaces.slice(0, limit).map((place) => ({
    id: place.id,
    name: place.name,
    type: place.subcategory || place.category,
    rating: place.rating,
    priceLevel: place.priceLevel ? "$".repeat(place.priceLevel) : undefined,
    location: place.location.address || place.location.city || "",
  }))
}
