// Types specific to Search feature

import type { Place, PlaceCategory } from "./explore"

export interface SearchFilters {
  query: string
  category: PlaceCategory | null
  minRating?: number
  priceLevel?: (1 | 2 | 3 | 4)[]
}

export interface SearchState {
  filters: SearchFilters
  results: Place[]
  loading: boolean
  hoveredPlaceId: string | null
  selectedPlaceId: string | null
  mapCenter: { lat: number; lng: number }
  mapBounds: google.maps.LatLngBounds | null
}

// Category chips for search filter
export interface SearchCategoryChip {
  id: PlaceCategory
  label: string
  icon: string
}

export const SEARCH_CATEGORY_CHIPS: SearchCategoryChip[] = [
  { id: "attractions", label: "Atracciones", icon: "landmark" },
  { id: "restaurants", label: "Restaurantes", icon: "utensils" },
  { id: "cafes", label: "Cafés", icon: "coffee" },
  { id: "nature", label: "Naturaleza", icon: "tree" },
  { id: "markets", label: "Compras", icon: "store" },
  { id: "bars", label: "Vida Nocturna", icon: "wine" },
]

// Default category when opening the search page
export const DEFAULT_SEARCH_CATEGORY: PlaceCategory = "attractions"
