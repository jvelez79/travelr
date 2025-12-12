// Types for Explore feature - Destination and Place discovery

// Place Categories (matching Google Places types)
export type PlaceCategory =
  | 'restaurants'
  | 'attractions'
  | 'cafes'
  | 'bars'
  | 'museums'
  | 'nature'

// Category metadata for display
export interface CategoryInfo {
  id: PlaceCategory
  label: string
  labelEn: string
  icon: string
  googleType: string // Google Places API type
}

// All available categories with metadata
export const PLACE_CATEGORIES: CategoryInfo[] = [
  { id: 'restaurants', label: 'Restaurantes', labelEn: 'Restaurants', icon: 'utensils', googleType: 'restaurant' },
  { id: 'attractions', label: 'Atracciones', labelEn: 'Attractions', icon: 'landmark', googleType: 'tourist_attraction' },
  { id: 'cafes', label: 'Cafés', labelEn: 'Cafes', icon: 'coffee', googleType: 'cafe' },
  { id: 'bars', label: 'Bares', labelEn: 'Bars', icon: 'wine', googleType: 'bar' },
  { id: 'museums', label: 'Museos', labelEn: 'Museums', icon: 'building-columns', googleType: 'museum' },
  { id: 'nature', label: 'Naturaleza', labelEn: 'Nature', icon: 'tree', googleType: 'park' },
]

// Location coordinates
export interface Coordinates {
  lat: number
  lng: number
}

// Core Place type
export interface Place {
  id: string                     // Google Place ID
  name: string
  category: PlaceCategory
  subcategory?: string           // "Italian", "Waterfall", etc.
  description?: string
  location: Coordinates & {
    address?: string
    city: string
    country: string
  }
  rating?: number                // 0-5 stars
  reviewCount?: number
  priceLevel?: 1 | 2 | 3 | 4     // $ to $$$$
  images: string[]
  openNow?: boolean
  openingHours?: string[]
  phone?: string
  website?: string
  googleMapsUrl?: string
  // Source tracking
  source?: 'google' | 'manual'
  sourceId?: string            // Original ID from source API
}

// Destination type
export interface Destination {
  id: string                     // Slug: "la-fortuna-costa-rica"
  name: string                   // "La Fortuna"
  fullName: string               // "La Fortuna, Costa Rica"
  country: string                // "Costa Rica"
  countryCode: string            // "CR"
  region?: string                // "Alajuela"
  description: string
  heroImage?: string
  location: Coordinates
  categories: PlaceCategory[]    // Available categories for this destination
  placesCount?: number
  climate?: {
    description: string
    bestMonths: string[]
  }
}

// Search result for destination autocomplete
export interface DestinationSearchResult {
  placeId: string                // Google Place ID
  name: string
  fullName: string
  country: string
  countryCode: string
  location?: Coordinates
}

// API response for places list
export interface PlacesResponse {
  places: Place[]
  total: number
  nextPageToken?: string
  category: PlaceCategory
  destination: string
}

// Destination detail response
export interface DestinationResponse {
  destination: Destination
  featuredPlaces: Place[]
}

// Add to trip payload
export interface AddToTripPayload {
  place: {
    id: string
    name: string
    category: PlaceCategory
    location: Coordinates
    address?: string
  }
  tripId: string
  dayNumber?: number             // Which day to add to
  timeSlot?: 'morning' | 'afternoon' | 'evening'
}

// Map marker for display
export interface MapMarker {
  id: string
  position: Coordinates
  title: string
  category: PlaceCategory
  isSelected?: boolean
}

// Helper: Get category info by id
export function getCategoryInfo(id: PlaceCategory): CategoryInfo | undefined {
  return PLACE_CATEGORIES.find(c => c.id === id)
}

// Helper: Get price level string
export function getPriceLevelString(level?: number): string {
  if (!level) return ''
  return '$'.repeat(level)
}

// Helper: Create slug from destination name
export function createDestinationSlug(name: string, country: string): string {
  const combined = `${name} ${country}`
  return combined
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '')    // Remove special chars
    .replace(/\s+/g, '-')            // Replace spaces with dashes
    .replace(/-+/g, '-')             // Remove duplicate dashes
    .trim()
}
