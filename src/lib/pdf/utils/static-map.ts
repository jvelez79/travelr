/**
 * Google Static Maps URL Generator
 * Generates static map images for PDF export
 */

import type { GeneratedPlan, AccommodationSuggestion } from '@/types/plan'

interface TravelBase {
  name: string
  location: { lat: number; lng: number }
  order: number
}

/**
 * Extract travel bases from plan (same logic as ItineraryMapView)
 */
export function extractTravelBases(plan: GeneratedPlan): TravelBase[] {
  if (!plan.accommodation?.suggestions) return []

  return plan.accommodation.suggestions
    .filter(
      (acc): acc is AccommodationSuggestion & { location: { lat: number; lng: number } } =>
        !!acc.location &&
        typeof acc.location.lat === 'number' &&
        typeof acc.location.lng === 'number' &&
        !(acc.location.lat === 0 && acc.location.lng === 0)
    )
    .map((acc, index) => ({
      name: acc.area || acc.name,
      location: { lat: acc.location.lat, lng: acc.location.lng },
      order: index,
    }))
    .sort((a, b) => a.order - b.order)
}

/**
 * Generate Google Static Maps URL for the travel route
 */
export function generateStaticMapUrl(
  plan: GeneratedPlan,
  options: {
    width?: number
    height?: number
    mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid'
  } = {}
): string | null {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.warn('Google Maps API key not configured for static map')
    return null
  }

  const bases = extractTravelBases(plan)

  if (bases.length === 0) {
    return null
  }

  const { width = 600, height = 400, mapType = 'roadmap' } = options

  // Build URL
  const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap'
  const params = new URLSearchParams()

  params.set('size', `${width}x${height}`)
  params.set('maptype', mapType)
  params.set('key', apiKey)

  // Add markers with labels (1, 2, 3, etc.)
  // Using teal color (0D9488)
  bases.forEach((base, index) => {
    const label = String(index + 1)
    const marker = `color:0x0D9488|label:${label}|${base.location.lat},${base.location.lng}`
    params.append('markers', marker)
  })

  // Add path connecting all bases (purple line like the interactive map)
  if (bases.length > 1) {
    const pathPoints = bases
      .map((base) => `${base.location.lat},${base.location.lng}`)
      .join('|')
    params.set('path', `color:0x7C3AED|weight:3|${pathPoints}`)
  }

  return `${baseUrl}?${params.toString()}`
}

/**
 * Generate a simple location map for a single point
 */
export function generateLocationMapUrl(
  lat: number,
  lng: number,
  options: {
    width?: number
    height?: number
    zoom?: number
  } = {}
): string | null {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return null
  }

  const { width = 400, height = 200, zoom = 14 } = options

  const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap'
  const params = new URLSearchParams()

  params.set('center', `${lat},${lng}`)
  params.set('zoom', String(zoom))
  params.set('size', `${width}x${height}`)
  params.set('maptype', 'roadmap')
  params.set('markers', `color:0x0D9488|${lat},${lng}`)
  params.set('key', apiKey)

  return `${baseUrl}?${params.toString()}`
}
