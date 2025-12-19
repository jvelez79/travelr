/**
 * Place Quality Scoring System
 *
 * Analyzes Google Places data to identify hidden gems, detect quality indicators,
 * and generate insights for users.
 *
 * Based on research from:
 * - https://googlereviewservices.com/google-restaurant-reviews-how-to-spot-hidden-gems-and-avoid-disasters
 * - https://www.fortressofdoors.com/an-algorithm-for-discovering-hidden-gems/
 *
 * Full documentation: docs/11-place-quality-scoring.md
 */

import type { Place, PlaceCategory } from '@/types/explore'

// ============================================================================
// Badge Types
// ============================================================================

type BadgeType =
  | 'hidden-gem'
  | 'exceptionally-rated'
  | 'new-favorite'
  | 'top-category'
  | 'insufficient-data'
  | 'polarized'
  | 'stale-reviews'

export interface PlaceBadge {
  type: BadgeType
  label: string
  emoji: string
  color: string // Tailwind color class
  tooltip: string
}

// Badge definitions with styling
const BADGE_DEFINITIONS: Record<BadgeType, Omit<PlaceBadge, 'tooltip'>> = {
  'hidden-gem': {
    type: 'hidden-gem',
    label: 'Pocos lo conocen',
    emoji: '💎',
    color: 'bg-purple-500',
  },
  'exceptionally-rated': {
    type: 'exceptionally-rated',
    label: 'Excepcionalmente valorado',
    emoji: '⭐',
    color: 'bg-amber-500',
  },
  'new-favorite': {
    type: 'new-favorite',
    label: 'Nuevo favorito',
    emoji: '🆕',
    color: 'bg-teal-500',
  },
  'top-category': {
    type: 'top-category',
    label: 'Top de categoría',
    emoji: '🏆',
    color: 'bg-yellow-500',
  },
  'insufficient-data': {
    type: 'insufficient-data',
    label: 'Pocas reviews',
    emoji: '⚠️',
    color: 'bg-gray-400',
  },
  polarized: {
    type: 'polarized',
    label: 'Opiniones divididas',
    emoji: '📊',
    color: 'bg-orange-500',
  },
  'stale-reviews': {
    type: 'stale-reviews',
    label: 'Sin actividad reciente',
    emoji: '🕐',
    color: 'bg-gray-400',
  },
}

// ============================================================================
// Thresholds (configurable)
// ============================================================================

const THRESHOLDS = {
  // Hidden Gem
  hiddenGem: {
    minRating: 4.5,
    minReviews: 30,
    maxReviews: 300,
  },
  // Exceptionally Rated
  exceptional: {
    minRating: 4.8,
    minReviews: 100,
  },
  // New Favorite (would need opening date)
  newFavorite: {
    minRating: 4.3,
    minReviews: 20,
    maxYearsOld: 2,
  },
  // Insufficient data
  insufficient: {
    maxReviews: 10,
  },
  // Confidence scoring
  sampleSizeCap: 500, // Reviews above this don't add more confidence
}

// ============================================================================
// Badge Detection Functions
// ============================================================================

/**
 * Check if a place qualifies as a Hidden Gem
 * Criteria: High rating (≥4.5) with moderate reviews (30-300)
 */
function isHiddenGem(place: Place): boolean {
  const { minRating, minReviews, maxReviews } = THRESHOLDS.hiddenGem
  return (
    (place.rating ?? 0) >= minRating &&
    (place.reviewCount ?? 0) >= minReviews &&
    (place.reviewCount ?? 0) <= maxReviews
  )
}

/**
 * Check if a place is exceptionally rated
 * Criteria: Very high rating (≥4.8) with significant sample (≥100)
 */
function isExceptionallyRated(place: Place): boolean {
  const { minRating, minReviews } = THRESHOLDS.exceptional
  return (
    (place.rating ?? 0) >= minRating && (place.reviewCount ?? 0) >= minReviews
  )
}

/**
 * Check if a place has insufficient data for reliable evaluation
 */
function hasInsufficientData(place: Place): boolean {
  return (place.reviewCount ?? 0) < THRESHOLDS.insufficient.maxReviews
}

/**
 * Get the primary badge for a place (only one badge shown at a time)
 * Priority: hidden-gem > exceptionally-rated > insufficient-data
 */
export function getPlaceBadge(
  place: Place,
  categoryRank?: number
): PlaceBadge | null {
  // Warning badges have lower priority, check positive badges first

  // Hidden Gem - highest priority for discovery
  if (isHiddenGem(place)) {
    const def = BADGE_DEFINITIONS['hidden-gem']
    return {
      ...def,
      tooltip: `${place.rating} estrellas con solo ${place.reviewCount} reviews - una joya por descubrir`,
    }
  }

  // Exceptionally Rated
  if (isExceptionallyRated(place)) {
    const def = BADGE_DEFINITIONS['exceptionally-rated']
    return {
      ...def,
      tooltip: `${place.rating} estrellas - uno de los mejores de la zona`,
    }
  }

  // Top of Category (if rank provided)
  if (categoryRank && categoryRank <= 3) {
    const def = BADGE_DEFINITIONS['top-category']
    return {
      ...def,
      tooltip: `#${categoryRank} mejor valorado en su categoría`,
    }
  }

  // Warning: Insufficient data
  if (hasInsufficientData(place)) {
    const def = BADGE_DEFINITIONS['insufficient-data']
    return {
      ...def,
      tooltip: 'Muy pocas reviews para evaluar con confianza',
    }
  }

  return null
}

// ============================================================================
// Scoring Functions
// ============================================================================

/**
 * Calculate a confidence score based on rating and sample size
 * Uses the principle: "4 stars with 100 reviews > 5 stars with 5 reviews"
 */
function calculateConfidenceScore(place: Place): number {
  const rating = place.rating ?? 0
  const reviewCount = place.reviewCount ?? 0

  if (reviewCount === 0) return 0

  const ratingWeight = rating / 5 // 0-1
  const sampleWeight = Math.min(reviewCount / THRESHOLDS.sampleSizeCap, 1) // 0-1

  return ratingWeight * 0.6 + sampleWeight * 0.4
}

/**
 * Calculate Hidden Gem score for discovery sorting
 * Favors high ratings with lower review counts
 */
function calculateHiddenGemScore(place: Place): number {
  const rating = place.rating ?? 0
  const reviewCount = place.reviewCount ?? 0

  // Insufficient sample
  if (reviewCount < THRESHOLDS.insufficient.maxReviews) return 0

  const ratingScore = rating / 5 // 0-1

  // Penalize very popular places (already discovered)
  const popularityPenalty = Math.min(reviewCount / 1000, 0.5)

  // Bonus for being in the "sweet spot" of reviews
  const { minReviews, maxReviews } = THRESHOLDS.hiddenGem
  const sweetSpotBonus =
    reviewCount >= minReviews && reviewCount <= maxReviews ? 0.2 : 0

  return ratingScore - popularityPenalty + sweetSpotBonus
}

/**
 * Calculate overall quality score for general sorting
 */
function calculateOverallScore(place: Place): number {
  const rating = place.rating ?? 0
  const reviewCount = place.reviewCount ?? 0

  const ratingWeight = 0.6
  const reviewCountWeight = 0.4

  const normalizedRating = rating / 5
  const normalizedReviews = Math.min(reviewCount / THRESHOLDS.sampleSizeCap, 1)

  return normalizedRating * ratingWeight + normalizedReviews * reviewCountWeight
}

// ============================================================================
// Insight Generation
// ============================================================================

/**
 * Generate contextual insights for a place
 * These explain WHY a place is special, not just show data
 */
function generateInsights(
  place: Place,
  categoryRank?: number
): string[] {
  const insights: string[] = []
  const rating = place.rating ?? 0
  const reviewCount = place.reviewCount ?? 0

  // Hidden gem insight (primary)
  if (rating >= 4.5 && reviewCount > 0 && reviewCount < 200) {
    insights.push(
      `Solo ${reviewCount} reviews pero ${rating} de rating - joya por descubrir`
    )
  }

  // High volume + high rating
  if (rating >= 4.7 && reviewCount >= 1000) {
    insights.push(
      `${rating} estrellas con ${reviewCount.toLocaleString()} reviews - calidad comprobada`
    )
  }

  // Top in category
  if (categoryRank && categoryRank <= 3) {
    insights.push(`Top ${categoryRank} en ${place.category}`)
  }

  // Price value insight
  if (place.priceLevel === 1 && rating >= 4.3) {
    insights.push(`Económico pero bien valorado - excelente relación calidad/precio`)
  }

  // Premium with justification
  if (place.priceLevel && place.priceLevel >= 3 && rating >= 4.6) {
    insights.push(
      `Premium pero justificado - ${rating} estrellas lo avalan`
    )
  }

  // Warning insights
  if (reviewCount < THRESHOLDS.insufficient.maxReviews && reviewCount > 0) {
    insights.push(`Solo ${reviewCount} reviews - pocos datos para evaluar`)
  }

  return insights
}

/**
 * Get the primary insight for a place (for card display)
 */
export function getPrimaryInsight(
  place: Place,
  categoryRank?: number
): string | null {
  const insights = generateInsights(place, categoryRank)
  return insights.length > 0 ? insights[0] : null
}

// ============================================================================
// Sorting Functions
// ============================================================================

/**
 * Sort places by hidden gem score (for discovery mode)
 */
export function sortByHiddenGemScore(places: Place[]): Place[] {
  return [...places].sort((a, b) => {
    const scoreA = calculateHiddenGemScore(a)
    const scoreB = calculateHiddenGemScore(b)
    return scoreB - scoreA
  })
}

/**
 * Sort places by overall quality
 */
export function sortByOverallQuality(places: Place[]): Place[] {
  return [...places].sort((a, b) => {
    const scoreA = calculateOverallScore(a)
    const scoreB = calculateOverallScore(b)
    return scoreB - scoreA
  })
}

/**
 * Sort places by confidence score
 */
function sortByConfidence(places: Place[]): Place[] {
  return [...places].sort((a, b) => {
    const scoreA = calculateConfidenceScore(a)
    const scoreB = calculateConfidenceScore(b)
    return scoreB - scoreA
  })
}

// ============================================================================
// Category Ranking
// ============================================================================

/**
 * Get the rank of a place within its category
 */
function getCategoryRank(
  place: Place,
  allPlacesInCategory: Place[]
): number {
  const sorted = sortByOverallQuality(allPlacesInCategory)
  const index = sorted.findIndex((p) => p.id === place.id)
  return index === -1 ? sorted.length + 1 : index + 1
}

/**
 * Add ranking information to places
 */
function addCategoryRanking(
  places: Place[],
  category: PlaceCategory
): Map<string, number> {
  const rankings = new Map<string, number>()
  const categoryPlaces = places.filter((p) => p.category === category)
  const sorted = sortByOverallQuality(categoryPlaces)

  sorted.forEach((place, index) => {
    rankings.set(place.id, index + 1)
  })

  return rankings
}

// ============================================================================
// Filtering
// ============================================================================

/**
 * Filter places to only show hidden gems
 */
function filterHiddenGems(places: Place[]): Place[] {
  return places.filter(isHiddenGem)
}

/**
 * Filter places by minimum rating
 */
export function filterByMinRating(places: Place[], minRating: number): Place[] {
  return places.filter((p) => (p.rating ?? 0) >= minRating)
}

/**
 * Filter places by price level
 */
function filterByPriceLevel(
  places: Place[],
  maxPrice: 1 | 2 | 3 | 4
): Place[] {
  return places.filter((p) => (p.priceLevel ?? 4) <= maxPrice)
}
