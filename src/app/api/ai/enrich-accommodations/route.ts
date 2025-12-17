import { NextRequest, NextResponse } from "next/server"
import type { Accommodation, AccommodationPlaceData, AccommodationMatchConfidence } from "@/types/accommodation"
import type { Place } from "@/types/explore"
import {
  findPlaceByName,
  normalizePlaceName,
} from "@/lib/places/matching"

interface EnrichAccommodationsRequest {
  accommodations: Accommodation[]
  destination: string
}

interface EnrichAccommodationsResponse {
  accommodations: Accommodation[]
  stats: {
    totalItems: number
    linkedItems: number
    unlinkedItems: number
  }
}

/**
 * POST /api/ai/enrich-accommodations
 *
 * Post-processes AI-generated accommodations to link them with real Google Places.
 * Uses the lodging category from Google Places to find matching hotels.
 *
 * Body: { accommodations: Accommodation[], destination: string }
 * Response: { accommodations: Accommodation[], stats: {...} }
 */
export async function POST(request: NextRequest) {
  try {
    const body: EnrichAccommodationsRequest = await request.json()
    const { accommodations, destination } = body

    if (!accommodations || !destination) {
      return NextResponse.json(
        { error: "Missing required parameters: accommodations, destination" },
        { status: 400 }
      )
    }

    // Fetch lodging places for the destination
    const lodgingPlaces = await fetchLodgingPlaces(destination)

    console.log("[enrich-accommodations] Found lodging places:", {
      destination,
      totalPlaces: lodgingPlaces.length,
    })

    // Enrich each accommodation
    let linkedCount = 0
    const enrichedAccommodations = accommodations.map((accommodation) => {
      const enriched = enrichAccommodation(accommodation, lodgingPlaces)
      if (enriched.googlePlaceId) {
        linkedCount++
      }
      return enriched
    })

    const response: EnrichAccommodationsResponse = {
      accommodations: enrichedAccommodations,
      stats: {
        totalItems: accommodations.length,
        linkedItems: linkedCount,
        unlinkedItems: accommodations.length - linkedCount,
      },
    }

    console.log("[enrich-accommodations] Completed:", response.stats)

    return NextResponse.json(response)
  } catch (error) {
    console.error("[enrich-accommodations] Error:", error)
    return NextResponse.json(
      { error: "Failed to enrich accommodations" },
      { status: 500 }
    )
  }
}

/**
 * Fetch lodging places from Google Places API for the destination
 */
async function fetchLodgingPlaces(destination: string): Promise<Place[]> {
  try {
    // Use the existing places search API
    const searchUrl = new URL("/api/places/search", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
    searchUrl.searchParams.set("query", `hotels in ${destination}`)
    searchUrl.searchParams.set("category", "lodging")
    searchUrl.searchParams.set("limit", "50")

    const response = await fetch(searchUrl.toString())

    if (!response.ok) {
      console.warn("[enrich-accommodations] Failed to fetch lodging places:", response.status)
      return []
    }

    const data = await response.json()
    return data.places || []
  } catch (error) {
    console.warn("[enrich-accommodations] Error fetching lodging places:", error)
    return []
  }
}

/**
 * Enrich a single accommodation with Google Places data
 */
function enrichAccommodation(
  accommodation: Accommodation,
  lodgingPlaces: Place[]
): Accommodation {
  if (lodgingPlaces.length === 0) {
    return {
      ...accommodation,
      matchConfidence: "none",
    }
  }

  // Try to find a matching place by name
  const searchName = `${accommodation.name} ${accommodation.area}`.trim()
  const match = findPlaceByName(searchName, lodgingPlaces, 0.7)

  // If no match with full name, try just the accommodation name
  const fallbackMatch = !match
    ? findPlaceByName(accommodation.name, lodgingPlaces, 0.75)
    : null

  const bestMatch = match || fallbackMatch

  if (!bestMatch) {
    console.log("[enrich-accommodations] No match found:", {
      name: accommodation.name,
      area: accommodation.area,
    })
    return {
      ...accommodation,
      matchConfidence: "none",
    }
  }

  // Determine confidence level
  let confidence: AccommodationMatchConfidence = "low"
  if (bestMatch.confidence >= 0.95) {
    confidence = "exact"
  } else if (bestMatch.confidence >= 0.85) {
    confidence = "high"
  }

  console.log("[enrich-accommodations] Match found:", {
    searchName,
    matchedPlace: bestMatch.place.name,
    confidence: bestMatch.confidence,
    mappedConfidence: confidence,
  })

  // Build place data
  const placeData: AccommodationPlaceData = {
    name: bestMatch.place.name,
    rating: bestMatch.place.rating,
    reviewCount: bestMatch.place.reviewCount,
    coordinates: {
      lat: bestMatch.place.location.lat,
      lng: bestMatch.place.location.lng,
    },
    address: bestMatch.place.location.address,
    images: bestMatch.place.images?.slice(0, 3),
    googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${bestMatch.place.id}`,
    website: undefined, // Not available in list response
    phone: undefined, // Not available in list response
    amenities: accommodation.amenities, // Keep original amenities
  }

  return {
    ...accommodation,
    googlePlaceId: bestMatch.place.id,
    placeData,
    matchConfidence: confidence,
  }
}
