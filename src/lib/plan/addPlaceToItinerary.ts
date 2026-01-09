import { recalculateTimeline } from "@/lib/timeUtils"
import { calculateTransportForTimeline } from "@/lib/transportUtils"
import type { GeneratedPlan, TimelineEntry, PlaceData } from "@/types/plan"
import type { Place, PlaceCategory } from "@/types/explore"

/**
 * Convert a Place object to PlaceData format for storing in timeline entry
 */
export function placeToPlaceData(place: Place): PlaceData {
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
    images: place.images?.slice(0, 10),
    googleMapsUrl: place.googleMapsUrl || `https://www.google.com/maps/place/?q=place_id:${place.id}`,
    phone: place.phone,
    website: place.website,
    openingHours: place.openingHours,
  }
}

/**
 * Get emoji icon for a place category
 */
export function getIconForCategory(category: PlaceCategory): string {
  const icons: Record<PlaceCategory, string> = {
    attractions: "🎯",
    nature: "🌋",
    restaurants: "🍽️",
    cafes: "☕",
    bars: "🍺",
    museums: "🎭",
    landmarks: "🗿",
    beaches: "🏖️",
    religious: "⛪",
    markets: "🛒",
    viewpoints: "🏔️",
    wellness: "🧘",
  }
  return icons[category] || "🎯"
}

/**
 * Add or replace a place in the itinerary
 *
 * @param plan - Current generated plan
 * @param place - Place to add from Google Places
 * @param dayNumber - Day number to add the activity to
 * @param dayLocation - Location string for the day (fallback for city)
 * @param mode - 'add' to create new activity, 'replace' to update existing
 * @param replaceActivityId - ID of activity to replace (required if mode is 'replace')
 * @returns Updated plan with the new/replaced activity
 */
export async function addPlaceToItinerary(
  plan: GeneratedPlan,
  place: Place,
  dayNumber: number,
  dayLocation: string,
  mode: 'add' | 'replace',
  replaceActivityId?: string
): Promise<GeneratedPlan> {
  const day = plan.itinerary.find(d => d.day === dayNumber)
  if (!day) {
    throw new Error(`Day ${dayNumber} not found in itinerary`)
  }

  let updatedItinerary

  if (mode === 'replace' && replaceActivityId) {
    // Replace mode: Update existing activity preserving time and duration
    const activityToReplace = day.timeline.find(a => a.id === replaceActivityId)

    const linkedActivity: TimelineEntry = {
      ...activityToReplace,
      id: activityToReplace?.id || `${place.id}-${Date.now()}`,
      // Keep original time and duration
      time: activityToReplace?.time || "Por definir",
      durationMinutes: activityToReplace?.durationMinutes || (place.category === 'restaurants' ? 90 : 120),
      // Replace name and add place data
      activity: place.name,
      location: place.location.city || dayLocation,
      icon: getIconForCategory(place.category),
      notes: place.description,
      placeId: place.id,
      placeData: placeToPlaceData(place),
      matchConfidence: 'exact',
    }

    updatedItinerary = plan.itinerary.map(d => {
      if (d.day !== dayNumber) return d
      const newTimeline = d.timeline.map(a =>
        a.id === replaceActivityId ? linkedActivity : a
      )
      return { ...d, timeline: newTimeline }
    })
  } else {
    // Add mode: Create new activity
    const newActivity: TimelineEntry = {
      id: `${place.id}-${Date.now()}`,
      time: "Por definir",
      activity: place.name,
      location: place.location.city || dayLocation,
      icon: getIconForCategory(place.category),
      notes: place.description,
      placeId: place.id,
      placeData: placeToPlaceData(place),
      matchConfidence: 'exact',
      durationMinutes: place.category === 'restaurants' ? 90 : 120,
    }

    updatedItinerary = plan.itinerary.map(d => {
      if (d.day !== dayNumber) return d
      const newTimeline = recalculateTimeline([...d.timeline, newActivity])
      return { ...d, timeline: newTimeline }
    })
  }

  let finalPlan = { ...plan, itinerary: updatedItinerary }

  // Calculate transport in background (non-blocking for better UX)
  const dayToUpdate = updatedItinerary.find(d => d.day === dayNumber)
  if (dayToUpdate && dayToUpdate.timeline.length >= 2) {
    try {
      const timelineWithTransport = await calculateTransportForTimeline(dayToUpdate.timeline)
      finalPlan = {
        ...finalPlan,
        itinerary: updatedItinerary.map(d =>
          d.day === dayNumber ? { ...d, timeline: timelineWithTransport } : d
        )
      }
    } catch (error) {
      console.error('Error calculating transport:', error)
      // Continue without transport info - it's not critical
    }
  }

  return finalPlan
}
