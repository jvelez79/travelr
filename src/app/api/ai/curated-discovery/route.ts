import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider } from '@/lib/ai'
import {
  CURATED_DISCOVERY_SYSTEM_PROMPT,
  fillCuratedPrompt,
} from '@/lib/ai/prompts-curated'
import { searchPlaceByName } from '@/lib/explore/google-places'
import type {
  CuratedDiscoveryRequest,
  CuratedDiscoveryResponse,
  CuratedPlace,
  AIRecommendation,
  AIRecommendationsResponse,
  CuratedCategoryType,
} from '@/types/curated'
import type { Place } from '@/types/explore'
import type { Json } from '@/types/database'

export const runtime = 'nodejs'
export const maxDuration = 60 // Allow up to 60 seconds for AI + validation

// Minimum rating to include a place
const MIN_RATING = 4.0

// Cache TTL: 30 days (shared cache benefits from longer TTL)
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Generate a cache key from destination string
 * Normalizes the string for consistent lookups
 */
function generateCacheKey(destination: string): string {
  return destination
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '')    // Remove special chars
    .replace(/\s+/g, '-')            // Replace spaces with dashes
    .replace(/-+/g, '-')             // Remove duplicate dashes
    .trim()
}

/**
 * POST /api/ai/curated-discovery
 *
 * Generates AI-curated recommendations for a destination,
 * then validates each against Google Places API.
 *
 * Body: { tripId?: string, destination: string }
 * Response: CuratedDiscoveryResponse
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse request
    const body: CuratedDiscoveryRequest = await request.json()
    const { tripId, destination } = body

    if (!destination) {
      return NextResponse.json(
        { error: 'destination is required' },
        { status: 400 }
      )
    }

    // 3. If tripId provided, verify it belongs to user
    if (tripId) {
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('id, user_id, destination')
        .eq('id', tripId)
        .single()

      if (tripError || !trip) {
        return NextResponse.json(
          { error: 'Trip not found' },
          { status: 404 }
        )
      }

      if (trip.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized - trip belongs to another user' },
          { status: 403 }
        )
      }
    }

    console.log('[curated-discovery] Starting generation for:', destination)

    // 4. Check cache first
    const cacheKey = generateCacheKey(destination)

    // CRITICAL: Use .maybeSingle() - cache entry may not exist
    const { data: cached } = await supabase
      .from('destination_suggestions')
      .select('suggestions, generated_at')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (cached?.suggestions) {
      console.log('[curated-discovery] Cache HIT:', cacheKey)

      // Type assertion for cached suggestions (via unknown to satisfy TS)
      const cachedSections = cached.suggestions as unknown as {
        mustSeeAttractions: CuratedPlace[]
        outstandingRestaurants: CuratedPlace[]
        uniqueExperiences: CuratedPlace[]
      }

      const response: CuratedDiscoveryResponse = {
        destination,
        tripId,
        sections: cachedSections,
        generatedAt: cached.generated_at || new Date().toISOString(),
        stats: {
          aiRecommendations: 0, // Unknown for cached responses
          validatedPlaces:
            cachedSections.mustSeeAttractions.length +
            cachedSections.outstandingRestaurants.length +
            cachedSections.uniqueExperiences.length,
          filteredByRating: 0,
        },
        cached: true,
      }

      return NextResponse.json(response)
    }

    console.log('[curated-discovery] Cache MISS:', cacheKey)

    // 5. Generate AI recommendations
    const aiRecommendations = await generateAIRecommendations(destination)

    if (!aiRecommendations) {
      return NextResponse.json(
        { error: 'Failed to generate AI recommendations' },
        { status: 500 }
      )
    }

    console.log('[curated-discovery] AI generated recommendations:', {
      mustSee: aiRecommendations.mustSeeAttractions.length,
      restaurants: aiRecommendations.outstandingRestaurants.length,
      experiences: aiRecommendations.uniqueExperiences.length,
    })

    // 6. Validate against Google Places (in parallel for each category)
    const [mustSeeAttractions, outstandingRestaurants, uniqueExperiences] = await Promise.all([
      validateRecommendations(
        aiRecommendations.mustSeeAttractions,
        destination,
        'must_see_attractions'
      ),
      validateRecommendations(
        aiRecommendations.outstandingRestaurants,
        destination,
        'outstanding_restaurants'
      ),
      validateRecommendations(
        aiRecommendations.uniqueExperiences,
        destination,
        'unique_experiences'
      ),
    ])

    // 7. Calculate stats
    const totalAI =
      aiRecommendations.mustSeeAttractions.length +
      aiRecommendations.outstandingRestaurants.length +
      aiRecommendations.uniqueExperiences.length

    const totalValidated =
      mustSeeAttractions.length +
      outstandingRestaurants.length +
      uniqueExperiences.length

    console.log('[curated-discovery] Validation complete:', {
      aiRecommendations: totalAI,
      validated: totalValidated,
      mustSee: mustSeeAttractions.length,
      restaurants: outstandingRestaurants.length,
      experiences: uniqueExperiences.length,
    })

    // 8. Build sections for response and cache
    const sections = {
      mustSeeAttractions,
      outstandingRestaurants,
      uniqueExperiences,
    }

    const generatedAt = new Date().toISOString()

    // 9. Store in cache (fire and forget - don't block response)
    // Only cache if we have results to avoid caching empty responses
    if (totalValidated > 0) {
      supabase
        .from('destination_suggestions')
        .upsert(
          {
            cache_key: cacheKey,
            place_name: destination,
            suggestions: sections as unknown as Json,
            generated_at: generatedAt,
            expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
          },
          { onConflict: 'cache_key' }
        )
        .then(({ error }) => {
          if (error) {
            console.error('[curated-discovery] Cache store error:', error.message)
          } else {
            console.log('[curated-discovery] Cached:', cacheKey)
          }
        })
    }

    // 10. Build response
    const response: CuratedDiscoveryResponse = {
      destination,
      tripId,
      sections,
      generatedAt,
      stats: {
        aiRecommendations: totalAI,
        validatedPlaces: totalValidated,
        filteredByRating: totalAI - totalValidated,
      },
      cached: false,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[curated-discovery] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate curated recommendations' },
      { status: 500 }
    )
  }
}

/**
 * Generate AI recommendations for a destination
 */
async function generateAIRecommendations(
  destination: string
): Promise<AIRecommendationsResponse | null> {
  try {
    const provider = getAIProvider()
    const prompt = fillCuratedPrompt(destination)

    const response = await provider.complete({
      systemPrompt: CURATED_DISCOVERY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 8000,
      temperature: 0.7,
      timeout: 45000, // 45 second timeout for AI
    })

    // Parse JSON response
    const content = response.content.trim()

    // Try to extract JSON from potential markdown code blocks
    let jsonString = content
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonString = jsonMatch[1].trim()
    }

    const parsed = JSON.parse(jsonString) as AIRecommendationsResponse

    // Validate structure
    if (
      !Array.isArray(parsed.mustSeeAttractions) ||
      !Array.isArray(parsed.outstandingRestaurants) ||
      !Array.isArray(parsed.uniqueExperiences)
    ) {
      console.error('[curated-discovery] Invalid AI response structure')
      return null
    }

    return parsed
  } catch (error) {
    console.error('[curated-discovery] AI generation error:', error)
    return null
  }
}

/**
 * Validate AI recommendations against Google Places
 * Returns only places that exist and have rating >= MIN_RATING
 */
async function validateRecommendations(
  recommendations: AIRecommendation[],
  destination: string,
  curatedCategory: CuratedCategoryType
): Promise<CuratedPlace[]> {
  const validatedPlaces: CuratedPlace[] = []

  // Process in batches of 5 to avoid overwhelming the API
  const batchSize = 5
  for (let i = 0; i < recommendations.length; i += batchSize) {
    const batch = recommendations.slice(i, i + batchSize)

    const batchResults = await Promise.all(
      batch.map(async (rec) => {
        try {
          // Search for the place in Google Places
          const places = await searchPlaceByName(rec.name, destination)

          if (!places || places.length === 0) {
            console.log(`[curated-discovery] Place not found: ${rec.name}`)
            return null
          }

          // Take the best match (first result)
          const place = places[0]

          // Filter by minimum rating
          if (!place.rating || place.rating < MIN_RATING) {
            console.log(
              `[curated-discovery] Place filtered by rating: ${rec.name} (${place.rating})`
            )
            return null
          }

          // Determine confidence based on name similarity
          const aiConfidence = getNameMatchConfidence(rec.name, place.name)

          // Build CuratedPlace
          const curatedPlace: CuratedPlace = {
            ...place,
            whyUnmissable: rec.whyUnmissable,
            curatedCategory,
            validatedAt: new Date().toISOString(),
            aiConfidence,
          }

          return curatedPlace
        } catch (error) {
          console.error(`[curated-discovery] Error validating ${rec.name}:`, error)
          return null
        }
      })
    )

    // Filter out nulls and add to results
    const validResults = batchResults.filter(
      (place): place is CuratedPlace => place !== null
    )
    validatedPlaces.push(...validResults)
  }

  return validatedPlaces
}

/**
 * Calculate confidence based on name similarity
 */
function getNameMatchConfidence(
  aiName: string,
  googleName: string
): 'high' | 'medium' {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .trim()

  const aiNorm = normalize(aiName)
  const googleNorm = normalize(googleName)

  // Exact match or contains
  if (aiNorm === googleNorm || googleNorm.includes(aiNorm) || aiNorm.includes(googleNorm)) {
    return 'high'
  }

  // Check word overlap
  const aiWords = new Set(aiNorm.split(/\s+/))
  const googleWords = new Set(googleNorm.split(/\s+/))
  const overlap = [...aiWords].filter((w) => googleWords.has(w)).length
  const overlapRatio = overlap / Math.min(aiWords.size, googleWords.size)

  return overlapRatio >= 0.5 ? 'high' : 'medium'
}
