/**
 * Destination Image Utilities
 * Gets hero images for the PDF export
 */

import type { GeneratedPlan } from '@/types/plan'

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || ''
const API_BASE = 'https://places.googleapis.com/v1'

/**
 * Get photo URL from Google Places photo name
 */
function getPhotoUrl(photoName: string, maxWidth: number = 800): string {
  if (!GOOGLE_PLACES_API_KEY) return ''
  return `${API_BASE}/${photoName}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_PLACES_API_KEY}`
}

/**
 * Search for a destination photo using Google Places API
 */
async function searchDestinationPhoto(destination: string): Promise<string | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    return null
  }

  try {
    // Search for the destination as a tourist attraction or landmark
    const response = await fetch(`${API_BASE}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.photos,places.displayName',
      },
      body: JSON.stringify({
        textQuery: `${destination} tourist attraction landmark`,
        languageCode: 'es',
        maxResultCount: 1,
      }),
    })

    if (!response.ok) {
      console.error('Google Places API error:', await response.text())
      return null
    }

    const data = await response.json()

    if (data.places?.[0]?.photos?.[0]?.name) {
      return getPhotoUrl(data.places[0].photos[0].name, 1200)
    }

    return null
  } catch (error) {
    console.error('Error searching destination photo:', error)
    return null
  }
}

/**
 * Get the best available destination image from the plan
 * Priority:
 * 1. First saved place with image
 * 2. First itinerary activity with placeData and image
 * 3. Search Google Places for destination
 */
export async function getDestinationImage(plan: GeneratedPlan): Promise<string | null> {
  // 1. Try saved places first
  if (plan.savedPlaces && plan.savedPlaces.length > 0) {
    for (const place of plan.savedPlaces) {
      if (place.images && place.images.length > 0 && place.images[0]) {
        return place.images[0]
      }
    }
  }

  // 2. Try itinerary activities with place data
  for (const day of plan.itinerary) {
    // Check timeline entries
    for (const entry of day.timeline) {
      if (entry.placeData?.images && entry.placeData.images.length > 0) {
        return entry.placeData.images[0]
      }
    }

    // Check activities
    if (day.activities) {
      for (const activity of day.activities) {
        if (activity.placeData?.images && activity.placeData.images.length > 0) {
          return activity.placeData.images[0]
        }
      }
    }
  }

  // 3. Search Google Places for the destination
  return searchDestinationPhoto(plan.trip.destination)
}

/**
 * Get multiple destination images for variety
 */
export async function getDestinationImages(
  plan: GeneratedPlan,
  maxImages: number = 5
): Promise<string[]> {
  const images: string[] = []

  // Collect from saved places
  if (plan.savedPlaces) {
    for (const place of plan.savedPlaces) {
      if (place.images && place.images.length > 0) {
        images.push(...place.images.slice(0, 2))
      }
      if (images.length >= maxImages) break
    }
  }

  // Collect from itinerary
  if (images.length < maxImages) {
    for (const day of plan.itinerary) {
      for (const entry of day.timeline) {
        if (entry.placeData?.images) {
          images.push(...entry.placeData.images.slice(0, 1))
        }
        if (images.length >= maxImages) break
      }
      if (images.length >= maxImages) break
    }
  }

  return images.slice(0, maxImages)
}
