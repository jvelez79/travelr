// Types for Explore feature - Destination and Place discovery

// Place Categories (matching Google Places types)
export type PlaceCategory =
  | 'restaurants'
  | 'attractions'
  | 'cafes'
  | 'bars'
  | 'museums'
  | 'nature'
  | 'landmarks'
  | 'beaches'
  | 'religious'
  | 'markets'
  | 'viewpoints'
  | 'wellness'

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
  { id: 'landmarks', label: 'Puntos de Interés', labelEn: 'Landmarks', icon: 'map-pin', googleType: 'point_of_interest' },
  { id: 'beaches', label: 'Playas', labelEn: 'Beaches', icon: 'umbrella-beach', googleType: 'beach' },
  { id: 'religious', label: 'Sitios Religiosos', labelEn: 'Religious Sites', icon: 'church', googleType: 'church' },
  { id: 'markets', label: 'Mercados', labelEn: 'Markets', icon: 'store', googleType: 'market' },
  { id: 'viewpoints', label: 'Miradores', labelEn: 'Viewpoints', icon: 'mountain', googleType: 'observation_deck' },
  { id: 'wellness', label: 'Bienestar', labelEn: 'Wellness', icon: 'spa', googleType: 'spa' },
]

// Location coordinates
export interface Coordinates {
  lat: number
  lng: number
}

// Accessibility options from Google Places API
export interface AccessibilityOptions {
  wheelchairAccessibleParking?: boolean
  wheelchairAccessibleEntrance?: boolean
  wheelchairAccessibleRestroom?: boolean
  wheelchairAccessibleSeating?: boolean  // For restaurants
}

// Menu/Serving information for restaurants, cafes, bars
export interface ServingOptions {
  servesBeer?: boolean
  servesWine?: boolean
  servesCocktails?: boolean
  servesCoffee?: boolean
  servesDessert?: boolean
  servesVegetarianFood?: boolean
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
  // Extended Google Places data
  accessibility?: AccessibilityOptions
  servingOptions?: ServingOptions
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

// ============================================================================
// Discovery Chips - Intent-based filters (INDEPENDENT from category tabs)
// ============================================================================

export interface DiscoveryChip {
  id: string
  label: string
  emoji: string
  // Local filter function applied to places - NEVER changes category tab
  localFilter?: (place: Place) => boolean
  sortBy?: 'hidden-gem' | 'quality'
}

// Discovery chips define INTENT, not category
// Category selection happens via tabs - these are 100% independent
export const DISCOVERY_CHIPS: DiscoveryChip[] = [
  {
    id: 'hidden-gems',
    label: 'Joyas escondidas',
    emoji: '💎',
    localFilter: (p) => (p.reviewCount ?? 0) < 500 && (p.rating ?? 0) >= 4.3,
    sortBy: 'hidden-gem',
  },
  {
    id: 'top-rated',
    label: 'Mejor valorados',
    emoji: '⭐',
    localFilter: (p) => (p.rating ?? 0) >= 4.5,
    sortBy: 'quality',
  },
  {
    id: 'fine-dining',
    label: 'Fine dining',
    emoji: '🍽️',
    localFilter: (p) => (p.priceLevel ?? 0) >= 3, // $$$ or more
    sortBy: 'quality',
  },
  {
    id: 'budget',
    label: 'Económico',
    emoji: '💰',
    localFilter: (p) => (p.priceLevel ?? 0) <= 2 && (p.rating ?? 0) >= 4.0,
    sortBy: 'quality',
  },
]

// ============================================================================
// Explore Modal Types
// ============================================================================

export interface ExploreModalProps {
  isOpen: boolean
  onClose: () => void
  // Context from canvas
  dayNumber: number
  dayLocation: string
  tripDestination: string
  // Mode: 'add' for new activity, 'replace' for linking existing activity
  mode?: 'add' | 'replace'
  replaceActivityId?: string
  activityName?: string // Name of activity being replaced (for header)
  // Callbacks
  onAddPlace: (place: Place, dayNumber: number) => void
  // Optional: preselected filters
  initialCategory?: PlaceCategory
  initialSearchQuery?: string
}

export interface ExploreFilters {
  location: string
  category: PlaceCategory | 'all'
  minRating: number | null      // 4, 4.5, etc.
  priceLevel: (1 | 2 | 3 | 4)[] // Multiple selection
  openNow: boolean
  searchQuery: string
}

export const DEFAULT_EXPLORE_FILTERS: ExploreFilters = {
  location: '',
  category: 'all',
  minRating: null,
  priceLevel: [],
  openNow: false,
  searchQuery: '',
}
