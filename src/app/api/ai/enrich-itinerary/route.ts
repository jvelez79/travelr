import { NextRequest, NextResponse } from "next/server"
import type { ItineraryDay, TimelineEntry, Activity, PlaceData } from "@/types/plan"
import type { Place, PlaceCategory } from "@/types/explore"
import type { PrefetchedPlaces } from "../prefetch-places/route"
import {
  findPlaceWithFallback,
  extractPlaceNameFromActivity,
  isValidGooglePlaceId,
} from "@/lib/places/matching"
import {
  createEmptyMetrics,
  logLinkingMetrics,
  type LinkingMetrics,
} from "@/lib/places/metrics"

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

    // Create flat array of all places for fallback matching
    const allPlaces = Array.from(placesMap.values())

    // DEBUG: Log available places for matching
    console.log('[LINKEO DEBUG] Enrich - Mapa de lugares disponibles:', {
      totalInMap: placesMap.size,
      sampleIds: Array.from(placesMap.keys()).slice(0, 10)
    })

    // Initialize metrics tracking
    const startTime = Date.now()
    const metrics = createEmptyMetrics()

    // Enrich each day
    const enrichedItinerary = itinerary.map((day) => {
      // Enrich timeline entries
      const enrichedTimeline = day.timeline.map((entry) => {
        metrics.totalTimeline++
        const entryWithId = entry as TimelineEntry & { suggestedPlaceId?: string }

        // Track invalid IDs
        if (entryWithId.suggestedPlaceId) {
          if (!isValidGooglePlaceId(entryWithId.suggestedPlaceId)) {
            metrics.invalidIdsDetected++
            // Check if it looks like a name
            if (entryWithId.suggestedPlaceId.length > 10 && !entryWithId.suggestedPlaceId.startsWith("ChIJ")) {
              metrics.idsUsedAsNames++
            }
          }
          metrics.fallbacksAttempted++
        }

        const enriched = enrichTimelineEntry(entry, placesMap, allPlaces)

        // Track match results
        switch (enriched.matchConfidence) {
          case "exact":
            metrics.linkedExact++
            if (entryWithId.suggestedPlaceId && !placesMap.has(entryWithId.suggestedPlaceId)) {
              metrics.fallbacksSuccessful++
            }
            break
          case "high":
            metrics.linkedHigh++
            metrics.fallbacksSuccessful++
            break
          case "low":
            metrics.linkedLow++
            metrics.fallbacksSuccessful++
            break
          default:
            metrics.unlinked++
        }

        return enriched
      })

      // Enrich activities (if present - optional field)
      const enrichedActivities = day.activities?.map((activity) => {
        metrics.totalActivities++
        const enriched = enrichActivity(activity, placesMap, allPlaces)

        switch (enriched.matchConfidence) {
          case "exact":
            metrics.linkedExact++
            break
          case "high":
            metrics.linkedHigh++
            break
          case "low":
            metrics.linkedLow++
            break
          default:
            metrics.unlinked++
        }

        return enriched
      })

      return {
        ...day,
        timeline: enrichedTimeline,
        ...(enrichedActivities && { activities: enrichedActivities }),
      }
    })

    // Calculate processing time
    metrics.processingTimeMs = Date.now() - startTime

    const totalItems = metrics.totalTimeline + metrics.totalActivities
    const linkedItems = metrics.linkedExact + metrics.linkedHigh + metrics.linkedLow

    const response: EnrichResponse = {
      itinerary: enrichedItinerary,
      stats: {
        totalItems,
        linkedItems,
        unlinkedItems: metrics.unlinked,
      },
    }

    // Log comprehensive metrics
    logLinkingMetrics(metrics)

    // DEBUG: Detailed logging of unlinked items to identify patterns
    const unlinkedDetails = enrichedItinerary.flatMap(day =>
      day.timeline
        .filter(t => !t.placeId)
        .map(t => {
          const entryWithId = t as typeof t & { suggestedPlaceId?: string }
          return {
            dayNumber: day.day,
            activityName: t.activity,
            location: t.location || '',
            suggestedId: entryWithId.suggestedPlaceId || null,
          }
        })
    )

    if (unlinkedDetails.length > 0) {
      console.log('[LINKEO] Actividades sin linkear:', {
        total: unlinkedDetails.length,
        details: unlinkedDetails.slice(0, 15),  // Show up to 15 for debugging
        hasMore: unlinkedDetails.length > 15,
      })
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
    "landmarks",
    "beaches",
    "religious",
    "markets",
    "viewpoints",
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
 * Uses fallback matching if exact ID match fails
 */
function enrichTimelineEntry(
  entry: TimelineEntry & { suggestedPlaceId?: string },
  placesMap: Map<string, Place>,
  allPlaces: Place[]
): TimelineEntry {
  const suggestedId = entry.suggestedPlaceId
  const activityName = extractPlaceNameFromActivity(entry.activity)

  // Try to find a place using the fallback system
  const match = findPlaceWithFallback(
    suggestedId,
    activityName,
    placesMap,
    allPlaces
  )

  if (!match) {
    // No match found even with fallback
    if (suggestedId) {
      console.log('[LINKEO DEBUG] Lugar NO encontrado (con fallback):', {
        suggestedId,
        activityName: entry.activity,
        location: entry.location,
      })
    }
    return {
      ...entry,
      matchConfidence: "none",
    }
  }

  // Enrich with place data
  const { suggestedPlaceId: _, ...cleanEntry } = entry
  return {
    ...cleanEntry,
    placeId: match.place.id,
    placeData: placeToPlaceData(match.place),
    matchConfidence: match.confidence,
  }
}

/**
 * Enrich an activity with place data
 * Uses fallback matching if exact ID match fails
 */
function enrichActivity(
  activity: Activity & { suggestedPlaceId?: string },
  placesMap: Map<string, Place>,
  allPlaces: Place[]
): Activity {
  const suggestedId = activity.suggestedPlaceId
  const activityName = extractPlaceNameFromActivity(activity.name)

  // Try to find a place using the fallback system
  const match = findPlaceWithFallback(
    suggestedId,
    activityName,
    placesMap,
    allPlaces
  )

  if (!match) {
    return {
      ...activity,
      matchConfidence: "none",
    }
  }

  // Enrich with place data
  const { suggestedPlaceId: _, ...cleanActivity } = activity
  return {
    ...cleanActivity,
    placeId: match.place.id,
    placeCategory: match.place.category as PlaceCategory,
    placeData: placeToPlaceData(match.place),
    matchConfidence: match.confidence,
  }
}
