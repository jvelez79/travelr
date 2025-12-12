import { NextRequest, NextResponse } from "next/server"
import { searchPlacesByCategory, getPlaceDetails } from "@/lib/explore/google-places"
import type { PlaceCategory } from "@/types/explore"

// Cache places for 1 hour
export const revalidate = 3600

/**
 * GET /api/explore/places
 *
 * Query params:
 * - destination: string (required) - Name of the destination
 * - category: PlaceCategory (required) - Category to search
 * - lat: number (required) - Latitude of destination
 * - lng: number (required) - Longitude of destination
 * - placeId: string (optional) - Get details for specific place
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

  // Search places by category
  const destination = searchParams.get("destination")
  const category = searchParams.get("category") as PlaceCategory
  const lat = parseFloat(searchParams.get("lat") || "0")
  const lng = parseFloat(searchParams.get("lng") || "0")

  if (!destination || !category) {
    return NextResponse.json(
      { error: "Missing required parameters: destination, category" },
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
  ]

  if (!validCategories.includes(category)) {
    return NextResponse.json(
      { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
      { status: 400 }
    )
  }

  if (lat === 0 && lng === 0) {
    return NextResponse.json(
      { error: "Invalid coordinates" },
      { status: 400 }
    )
  }

  try {
    const places = await searchPlacesByCategory(
      destination,
      category,
      { lat, lng }
    )

    return NextResponse.json({
      places,
      count: places.length,
      destination,
      category,
    })
  } catch (error) {
    console.error("Error fetching places:", error)
    return NextResponse.json(
      { error: "Failed to fetch places" },
      { status: 500 }
    )
  }
}
