// Types for Curated Discovery feature
// AI-validated recommendations categorized by experience type

import type { Place, PlaceCategory } from './explore'

/**
 * Curated category types - the 3 main discovery categories
 */
export type CuratedCategoryType =
  | 'must_see_attractions'    // Atracciones Imperdibles
  | 'outstanding_restaurants' // Restaurantes Outstanding
  | 'unique_experiences'      // Experiencias Unicas

/**
 * Category metadata for display
 */
export interface CuratedCategoryInfo {
  id: CuratedCategoryType
  label: string
  labelEn: string
  description: string
  icon: string // Lucide icon name
}

/**
 * Category configuration
 */
export const CURATED_CATEGORIES: CuratedCategoryInfo[] = [
  {
    id: 'must_see_attractions',
    label: 'Atracciones Imperdibles',
    labelEn: 'Must-See Attractions',
    description: 'Lugares iconicos, historicos y naturales',
    icon: 'Landmark',
  },
  {
    id: 'outstanding_restaurants',
    label: 'Restaurantes Outstanding',
    labelEn: 'Outstanding Restaurants',
    description: 'Gastronomia local destacada',
    icon: 'UtensilsCrossed',
  },
  {
    id: 'unique_experiences',
    label: 'Experiencias Unicas',
    labelEn: 'Unique Experiences',
    description: 'Actividades exclusivas del destino',
    icon: 'Sparkles',
  },
]

/**
 * AI-generated recommendation before Google Places validation
 */
export interface AIRecommendation {
  name: string
  category: CuratedCategoryType
  whyUnmissable: string // 1-2 sentences explaining why this place is special
}

/**
 * AI generation response format
 */
export interface AIRecommendationsResponse {
  destination: string
  mustSeeAttractions: AIRecommendation[]
  outstandingRestaurants: AIRecommendation[]
  uniqueExperiences: AIRecommendation[]
}

/**
 * Curated place - a validated recommendation with Google Places data
 */
export interface CuratedPlace extends Place {
  // AI-specific fields
  whyUnmissable: string       // AI justification for why this place is special
  curatedCategory: CuratedCategoryType

  // Validation metadata
  validatedAt: string         // ISO timestamp
  aiConfidence: 'high' | 'medium' // Based on name match quality
}

/**
 * Curated section - a category with its validated places
 */
export interface CuratedSection {
  category: CuratedCategoryInfo
  places: CuratedPlace[]
  loading: boolean
  error?: string
}

/**
 * API response for curated discovery endpoint
 */
export interface CuratedDiscoveryResponse {
  destination: string
  tripId?: string
  sections: {
    mustSeeAttractions: CuratedPlace[]
    outstandingRestaurants: CuratedPlace[]
    uniqueExperiences: CuratedPlace[]
  }
  generatedAt: string
  stats: {
    aiRecommendations: number
    validatedPlaces: number
    filteredByRating: number
  }
}

/**
 * Request body for curated discovery API
 */
export interface CuratedDiscoveryRequest {
  tripId?: string
  destination: string
}

/**
 * Helper: Get category info by id
 */
export function getCuratedCategoryInfo(id: CuratedCategoryType): CuratedCategoryInfo | undefined {
  return CURATED_CATEGORIES.find(c => c.id === id)
}

/**
 * Helper: Map PlaceCategory to potential CuratedCategoryType
 */
export function mapPlaceCategoryToCurated(category: PlaceCategory): CuratedCategoryType {
  switch (category) {
    case 'restaurants':
    case 'cafes':
    case 'bars':
      return 'outstanding_restaurants'
    case 'attractions':
    case 'museums':
    case 'landmarks':
    case 'religious':
    case 'viewpoints':
      return 'must_see_attractions'
    case 'nature':
    case 'beaches':
    case 'markets':
    case 'wellness':
    default:
      return 'unique_experiences'
  }
}
