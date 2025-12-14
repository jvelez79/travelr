import { NextRequest, NextResponse } from "next/server"
import { searchPlacesByCategory, searchPlacesByText, getPlaceDetails } from "@/lib/explore/google-places"
import type { PlaceCategory } from "@/types/explore"

// Cache places for 1 hour
export const revalidate = 3600

/**
 * GET /api/explore/places
 *
 * Query params:
 * - destination: string (required) - Name of the destination
 * - category: PlaceCategory (required for category search) - Category to search
 * - query: string (required for text search) - Text to search
 * - lat: number (required) - Latitude of destination
 * - lng: number (required) - Longitude of destination
 * - placeId: string (optional) - Get details for specific place
 * - pageToken: string (optional) - Pagination token
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  // Get place details by ID
  const placeId = searchParams.get("placeId")
  if (placeId) {
    const place = await getPlaceDetails(placeId)
    if (!place) {
      return NextResponse.json(
        { error: "Place not found" },
        { status: 404 }
      )
    }
    return NextResponse.json(place)
  }

  // Common params
  const destination = searchParams.get("destination")
  const lat = parseFloat(searchParams.get("lat") || "0")
  const lng = parseFloat(searchParams.get("lng") || "0")
  const pageToken = searchParams.get("pageToken") || undefined

  if (!destination) {
    return NextResponse.json(
      { error: "Missing required parameter: destination" },
      { status: 400 }
    )
  }

  if (lat === 0 && lng === 0) {
    return NextResponse.json(
      { error: "Invalid coordinates" },
      { status: 400 }
    )
  }

  // Text search (search bar)
  const query = searchParams.get("query")
  if (query) {
    try {
      const result = await searchPlacesByText(query, destination, { lat, lng })
      return NextResponse.json({
        places: result.places,
        count: result.places.length,
        destination,
        query,
      })
    } catch (error) {
      console.error("Error searching places by text:", error)
      return NextResponse.json(
        { error: "Failed to search places" },
        { status: 500 }
      )
    }
  }

  // Category search
  const category = searchParams.get("category") as PlaceCategory | null

  if (!category) {
    return NextResponse.json(
      { error: "Missing required parameter: category or query" },
      { status: 400 }
    )
  }

  const validCategories: PlaceCategory[] = [
    "restaurants",
    "attractions",
    "cafes",
    "bars",
    "museums",
    "nature",
    "landmarks",
    "beaches",
    "religious",
    "markets",
    "viewpoints",
  ]

  if (!validCategories.includes(category)) {
    return NextResponse.json(
      { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
      { status: 400 }
    )
  }

  try {
    const result = await searchPlacesByCategory(destination, category, { lat, lng }, 15000, pageToken)

    return NextResponse.json({
      places: result.places,
      count: result.places.length,
      destination,
      category,
      nextPageToken: result.nextPageToken,
    })
  } catch (error) {
    console.error("Error fetching places:", error)
    return NextResponse.json(
      { error: "Failed to fetch places" },
      { status: 500 }
    )
  }
}
