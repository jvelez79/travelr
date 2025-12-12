import { NextRequest, NextResponse } from "next/server"
import type { ItineraryDay, TimelineEntry, Activity, PlaceData } from "@/types/plan"
import type { Place, PlaceCategory } from "@/types/explore"
import type { PrefetchedPlaces } from "../prefetch-places/route"

interface EnrichRequest {
  itinerary: ItineraryDay[]
  fullPlaces: PrefetchedPlaces
}

interface EnrichResponse {
  itinerary: ItineraryDay[]
  stats: {
    totalItems: number
    linkedItems: number
    unlinkedItems: number
  }
}

/**
 * POST /api/ai/enrich-itinerary
 *
 * Post-processes the AI-generated itinerary to link activities with real Google Places.
 * Looks for suggestedPlaceId in timeline entries and activities, then populates placeData.
 *
 * Body: { itinerary: ItineraryDay[], fullPlaces: PrefetchedPlaces }
 * Response: { itinerary: ItineraryDay[], stats: { totalItems, linkedItems, unlinkedItems } }
 */
export async function POST(request: NextRequest) {
  try {
    const body: EnrichRequest = await request.json()
    const { itinerary, fullPlaces } = body

    if (!itinerary || !fullPlaces) {
      return NextResponse.json(
        { error: "Missing required parameters: itinerary, fullPlaces" },
        { status: 400 }
      )
    }

    // Create lookup map from all places
    const placesMap = buildPlacesMap(fullPlaces)

    let totalItems = 0
    let linkedItems = 0

    // Enrich each day
    const enrichedItinerary = itinerary.map((day) => {
      // Enrich timeline entries
      const enrichedTimeline = day.timeline.map((entry) => {
        totalItems++
        const enriched = enrichTimelineEntry(entry, placesMap)
        if (enriched.placeId) linkedItems++
        return enriched
      })

      // Enrich activities (if present - optional field)
      const enrichedActivities = day.activities?.map((activity) => {
        totalItems++
        const enriched = enrichActivity(activity, placesMap)
        if (enriched.placeId) linkedItems++
        return enriched
      })

      return {
        ...day,
        timeline: enrichedTimeline,
        ...(enrichedActivities && { activities: enrichedActivities }),
      }
    })

    const response: EnrichResponse = {
      itinerary: enrichedItinerary,
      stats: {
        totalItems,
        linkedItems,
        unlinkedItems: totalItems - linkedItems,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[enrich-itinerary] Error:", error)
    return NextResponse.json(
      { error: "Failed to enrich itinerary" },
      { status: 500 }
    )
  }
}

/**
 * Build a map of all places by ID for fast lookup
 */
function buildPlacesMap(fullPlaces: PrefetchedPlaces): Map<string, Place> {
  const map = new Map<string, Place>()

  const categories: (keyof PrefetchedPlaces)[] = [
    "restaurants",
    "attractions",
    "cafes",
    "bars",
    "museums",
    "nature",
  ]

  for (const category of categories) {
    const places = fullPlaces[category] || []
    for (const place of places) {
      map.set(place.id, place)
    }
  }

  return map
}

/**
 * Convert Place to PlaceData (embedded format)
 */
function placeToPlaceData(place: Place): PlaceData {
  return {
    name: place.name,
    category: place.category,
    rating: place.rating,
    reviewCount: place.reviewCount,
    priceLevel: place.priceLevel,
    coordinates: {
      lat: place.location.lat,
      lng: place.location.lng,
    },
    address: place.location.address,
    images: place.images?.slice(0, 2), // Max 2 for compact display
    googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.id}`,
    phone: undefined, // Not available in list response
    website: undefined, // Not available in list response
    openingHours: place.openingHours,
  }
}

/**
 * Enrich a timeline entry with place data
 */
function enrichTimelineEntry(
  entry: TimelineEntry & { suggestedPlaceId?: string },
  placesMap: Map<string, Place>
): TimelineEntry {
  // Check if AI suggested a place ID
  const suggestedId = entry.suggestedPlaceId
  if (!suggestedId) {
    return {
      ...entry,
      matchConfidence: "none",
    }
  }

  // Look up the place
  const place = placesMap.get(suggestedId)
  if (!place) {
    // AI suggested an ID that doesn't exist - could be hallucinated
    console.warn(`[enrich] Place not found: ${suggestedId}`)
    return {
      ...entry,
      matchConfidence: "none",
    }
  }

  // Enrich with place data
  const { suggestedPlaceId: _, ...cleanEntry } = entry
  return {
    ...cleanEntry,
    placeId: place.id,
    placeData: placeToPlaceData(place),
    matchConfidence: "exact",
  }
}

/**
 * Enrich an activity with place data
 */
function enrichActivity(
  activity: Activity & { suggestedPlaceId?: string },
  placesMap: Map<string, Place>
): Activity {
  // Check if AI suggested a place ID
  const suggestedId = activity.suggestedPlaceId
  if (!suggestedId) {
    return {
      ...activity,
      matchConfidence: "none",
    }
  }

  // Look up the place
  const place = placesMap.get(suggestedId)
  if (!place) {
    // AI suggested an ID that doesn't exist
    console.warn(`[enrich] Place not found: ${suggestedId}`)
    return {
      ...activity,
      matchConfidence: "none",
    }
  }

  // Enrich with place data
  const { suggestedPlaceId: _, ...cleanActivity } = activity
  return {
    ...cleanActivity,
    placeId: place.id,
    placeCategory: place.category as PlaceCategory,
    placeData: placeToPlaceData(place),
    matchConfidence: "exact",
  }
}
