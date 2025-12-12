import { NextRequest, NextResponse } from "next/server"
import {
  searchPlacesByCategory,
  autocompleteDestination,
  getDestinationInfo,
} from "@/lib/explore/google-places"
import type { PlaceCategory, Place, Coordinates } from "@/types/explore"

// Cache for 1 hour
export const revalidate = 3600

// Categories to prefetch
const CATEGORIES: PlaceCategory[] = [
  "restaurants",
  "attractions",
  "cafes",
  "bars",
  "museums",
  "nature",
]

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

    // Step 2: Search places in parallel for all categories
    const searchPromises = CATEGORIES.map((category) =>
      searchPlacesByCategory(destination, category, coordinates, 20000)
    )

    const results = await Promise.all(searchPromises)

    // Step 3: Build response
    const fullPlaces: PrefetchedPlaces = {
      restaurants: results[0] || [],
      attractions: results[1] || [],
      cafes: results[2] || [],
      bars: results[3] || [],
      museums: results[4] || [],
      nature: results[5] || [],
    }

    // Step 4: Create simplified version for AI prompts (max 15 per category)
    const placesForAI: Record<PlaceCategory, PlaceForAI[]> = {
      restaurants: simplifyPlaces(fullPlaces.restaurants, 15),
      attractions: simplifyPlaces(fullPlaces.attractions, 15),
      cafes: simplifyPlaces(fullPlaces.cafes, 15),
      bars: simplifyPlaces(fullPlaces.bars, 15),
      museums: simplifyPlaces(fullPlaces.museums, 15),
      nature: simplifyPlaces(fullPlaces.nature, 15),
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
 */
function simplifyPlaces(places: Place[], limit: number): PlaceForAI[] {
  return places.slice(0, limit).map((place) => ({
    id: place.id,
    name: place.name,
    type: place.subcategory || place.category,
    rating: place.rating,
    priceLevel: place.priceLevel ? "$".repeat(place.priceLevel) : undefined,
    location: place.location.address || place.location.city || "",
  }))
}
