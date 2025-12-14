import type { Place } from '@/types/explore'
import type { SavedPlace } from '@/types/plan'

/**
 * Converts a Place (from Google Places) to SavedPlace (for saving)
 */
export function createSavedPlaceFromPlace(place: Place): SavedPlace {
  return {
    id: `saved-${place.id}-${Date.now()}`,
    name: place.name,

    // Category
    category: place.category,
    subcategory: place.subcategory,

    // Location (critical for directions)
    location: {
      lat: place.location.lat,
      lng: place.location.lng,
      address: place.location.address,
      city: place.location.city,
      country: place.location.country,
    },

    // Ratings
    rating: place.rating,
    reviewCount: place.reviewCount,
    priceLevel: place.priceLevel,

    // Content
    description: place.description,
    images: place.images?.slice(0, 10), // Limit to 10 images

    // Contact
    phone: place.phone,
    website: place.website,
    openingHours: place.openingHours,

    // Extended Google Places data
    accessibility: place.accessibility,
    servingOptions: place.servingOptions,

    // Source metadata
    sourceInfo: {
      source: place.source || 'google',
      sourceId: place.sourceId || place.id,
      googleMapsUrl:
        place.googleMapsUrl ||
        `https://www.google.com/maps/place/?q=place_id:${place.id}`,
      lastFetched: new Date().toISOString(),
    },

    // Management
    addedAt: new Date().toISOString(),

    // Legacy field for backwards compatibility
    placeId: place.id,
  }
}

/**
 * Gets Google Maps URL from a SavedPlace
 */
export function getGoogleMapsUrl(place: SavedPlace): string {
  // Use stored URL if available
  if (place.sourceInfo?.googleMapsUrl) {
    return place.sourceInfo.googleMapsUrl
  }

  // Fallback: use place_id if available
  if (place.sourceInfo?.sourceId) {
    return `https://www.google.com/maps/place/?q=place_id:${place.sourceInfo.sourceId}`
  }

  // Fallback: use legacy placeId
  if (place.placeId) {
    return `https://www.google.com/maps/place/?q=place_id:${place.placeId}`
  }

  // Fallback: use coordinates
  if (place.location?.lat && place.location?.lng) {
    return `https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}`
  }

  // Last resort: search by name
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`
}

/**
 * Gets Google Search URL for a place
 */
export function getGoogleSearchUrl(place: SavedPlace): string {
  const searchTerms = [place.name]
  if (place.location?.city) searchTerms.push(place.location.city)
  if (place.location?.country) searchTerms.push(place.location.country)

  return `https://www.google.com/search?q=${encodeURIComponent(searchTerms.join(' '))}`
}

/**
 * Gets directions URL from origin to a saved place
 */
export function getDirectionsUrl(
  place: SavedPlace,
  origin?: { lat: number; lng: number } | string,
  travelMode: 'driving' | 'walking' | 'transit' = 'driving'
): string {
  let destination: string
  if (place.location?.lat && place.location?.lng) {
    destination = `${place.location.lat},${place.location.lng}`
  } else if (place.location?.address) {
    destination = place.location.address
  } else {
    destination = place.name
  }

  let originParam = ''
  if (origin) {
    if (typeof origin === 'string') {
      originParam = `&origin=${encodeURIComponent(origin)}`
    } else {
      originParam = `&origin=${origin.lat},${origin.lng}`
    }
  }

  return `https://www.google.com/maps/dir/?api=1${originParam}&destination=${encodeURIComponent(destination)}&travelmode=${travelMode}`
}

/**
 * Migrates old format SavedPlaces to new format
 * Should be called when loading a plan
 */
export function migrateSavedPlaces(places: SavedPlace[]): SavedPlace[] {
  return places.map((place) => {
    // If already has new format, return without changes
    if (place.sourceInfo || place.location) {
      return place
    }

    // Migrate old format
    return {
      ...place,
      sourceInfo: place.placeId
        ? {
            source: 'google' as const,
            sourceId: place.placeId,
            googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.placeId}`,
          }
        : undefined,
      // Other fields remain undefined - can be re-fetched if needed
    }
  })
}

/**
 * Checks if a place has complete data (not just migrated)
 */
export function hasCompleteData(place: SavedPlace): boolean {
  return !!(
    place.location?.lat &&
    place.location?.lng &&
    place.sourceInfo?.sourceId
  )
}
