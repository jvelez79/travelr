/**
 * Fuzzy Matching Utilities for Place Names
 *
 * Provides fallback matching when AI-suggested place IDs are invalid or missing.
 * Uses string normalization and Levenshtein distance for similarity scoring.
 */

import type { Place } from "@/types/explore"

/**
 * Normalize a place name for comparison
 * - Lowercase
 * - Remove accents/diacritics
 * - Remove common articles (El, La, The, etc.)
 * - Remove punctuation
 * - Normalize whitespace
 */
export function normalizePlaceName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/^(el |la |los |las |the |a |an |le |les |il |lo |gli |i )/i, "") // Remove articles
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits needed
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  // Initialize first column
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  // Initialize first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

/**
 * Calculate similarity score between two strings (0-1)
 * Uses Levenshtein distance normalized by max length
 */
function calculateSimilarity(a: string, b: string): number {
  const normA = normalizePlaceName(a)
  const normB = normalizePlaceName(b)

  // Exact match after normalization
  if (normA === normB) return 1.0

  // Empty strings
  const maxLen = Math.max(normA.length, normB.length)
  if (maxLen === 0) return 1.0

  // Calculate normalized distance
  const distance = levenshteinDistance(normA, normB)
  return 1 - distance / maxLen
}

/**
 * Check if a string appears to be a valid Google Place ID
 * Google Place IDs typically start with "ChIJ" followed by alphanumeric characters
 */
export function isValidGooglePlaceId(id: string): boolean {
  if (!id || typeof id !== "string") return false

  // Google Place IDs start with "ChIJ" and are typically 27+ characters
  // They contain alphanumeric characters, underscores, and hyphens
  return /^ChIJ[a-zA-Z0-9_-]{20,}$/.test(id)
}

/**
 * Find the best matching place by name
 * Returns the place and confidence score, or null if no match above threshold
 *
 * @param searchName - The name to search for
 * @param places - Array of places to search in
 * @param threshold - Minimum similarity score (0-1) to consider a match
 */
export function findPlaceByName(
  searchName: string,
  places: Place[],
  threshold: number = 0.75
): { place: Place; confidence: number } | null {
  if (!searchName || !places.length) return null

  let bestMatch: Place | null = null
  let bestScore = 0

  const normalizedSearch = normalizePlaceName(searchName)

  for (const place of places) {
    const normalizedPlace = normalizePlaceName(place.name)

    // 1. Exact normalized match (highest priority)
    if (normalizedPlace === normalizedSearch) {
      return { place, confidence: 1.0 }
    }

    // 2. One contains the other (high confidence)
    if (
      normalizedPlace.includes(normalizedSearch) ||
      normalizedSearch.includes(normalizedPlace)
    ) {
      // Give higher score to better containment
      const containmentScore =
        Math.min(normalizedPlace.length, normalizedSearch.length) /
        Math.max(normalizedPlace.length, normalizedSearch.length)

      const score = 0.85 + containmentScore * 0.1 // 0.85-0.95

      if (score > bestScore) {
        bestScore = score
        bestMatch = place
      }
      continue
    }

    // 3. Calculate fuzzy similarity
    const score = calculateSimilarity(searchName, place.name)

    if (score > bestScore && score >= threshold) {
      bestScore = score
      bestMatch = place
    }
  }

  return bestMatch ? { place: bestMatch, confidence: bestScore } : null
}

/**
 * Try to find a place match using multiple strategies
 * First tries exact ID match, then falls back to name matching
 *
 * @param suggestedId - The ID suggested by AI (may be invalid)
 * @param activityName - The activity name from the timeline
 * @param placesMap - Map of place IDs to places
 * @param allPlaces - Array of all places for fuzzy matching
 */
export function findPlaceWithFallback(
  suggestedId: string | undefined,
  activityName: string,
  placesMap: Map<string, Place>,
  allPlaces: Place[]
): { place: Place; confidence: "exact" | "high" | "low" } | null {
  // Strategy 1: Exact ID match
  if (suggestedId) {
    const exactMatch = placesMap.get(suggestedId)
    if (exactMatch) {
      return { place: exactMatch, confidence: "exact" }
    }

    // Strategy 2: If ID looks like a name (not a valid Google Place ID),
    // try to match it as a name
    if (!isValidGooglePlaceId(suggestedId)) {
      const nameMatch = findPlaceByName(suggestedId, allPlaces, 0.75)
      if (nameMatch) {
        console.log("[LINKEO] Recovered using ID as name:", {
          invalidId: suggestedId,
          matchedPlace: nameMatch.place.name,
          confidence: nameMatch.confidence,
        })
        return {
          place: nameMatch.place,
          confidence: nameMatch.confidence >= 0.9 ? "high" : "low",
        }
      }
    }
  }

  // Strategy 3: Match by activity name
  const activityMatch = findPlaceByName(activityName, allPlaces, 0.8)
  if (activityMatch) {
    console.log("[LINKEO] Matched by activity name:", {
      activityName,
      matchedPlace: activityMatch.place.name,
      confidence: activityMatch.confidence,
    })
    return {
      place: activityMatch.place,
      confidence: activityMatch.confidence >= 0.9 ? "high" : "low",
    }
  }

  return null
}

/**
 * Extract a potential place name from an activity description
 * Handles formats like "Visita a la Fontana di Trevi" → "Fontana di Trevi"
 */
export function extractPlaceNameFromActivity(activity: string): string {
  // Common prefixes to remove
  const prefixes = [
    /^visita (a |al |a la |a los |a las )?/i,
    /^explorar /i,
    /^conocer /i,
    /^tour (por |de |en )?/i,
    /^recorrido (por |de |en )?/i,
    /^paseo (por |de |en )?/i,
    /^caminata (por |de |en |hacia )?/i,
    /^almuerzo (en |at )?/i,
    /^cena (en |at )?/i,
    /^desayuno (en |at )?/i,
    /^café (en |at )?/i,
  ]

  let cleaned = activity.trim()

  for (const prefix of prefixes) {
    cleaned = cleaned.replace(prefix, "")
  }

  return cleaned.trim()
}
