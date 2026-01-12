/**
 * Tests for useCuratedDiscovery hook
 */

import { describe, it, expect } from 'vitest'
import {
  getPlacesByCategory,
  getTotalCuratedCount,
} from '../useCuratedDiscovery'
import type { CuratedDiscoveryResponse, CuratedPlace } from '@/types/curated'

// Helper to create mock curated place
function createMockPlace(
  id: string,
  name: string,
  curatedCategory: CuratedPlace['curatedCategory']
): CuratedPlace {
  return {
    id,
    name,
    category: 'attractions',
    location: {
      lat: 10.0,
      lng: -84.0,
      city: 'San Jose',
      country: 'Costa Rica',
    },
    images: [],
    whyUnmissable: 'A great place to visit',
    curatedCategory,
    validatedAt: new Date().toISOString(),
    aiConfidence: 'high',
  }
}

// Mock response data
const mockResponse: CuratedDiscoveryResponse = {
  destination: 'Costa Rica',
  tripId: 'trip-123',
  sections: {
    mustSeeAttractions: [
      createMockPlace('1', 'Arenal Volcano', 'must_see_attractions'),
      createMockPlace('2', 'Manuel Antonio', 'must_see_attractions'),
    ],
    outstandingRestaurants: [
      createMockPlace('3', 'Restaurante Silvestre', 'outstanding_restaurants'),
    ],
    uniqueExperiences: [
      createMockPlace('4', 'Canopy Tour', 'unique_experiences'),
      createMockPlace('5', 'Hot Springs', 'unique_experiences'),
      createMockPlace('6', 'Coffee Tour', 'unique_experiences'),
    ],
  },
  generatedAt: new Date().toISOString(),
  stats: {
    aiRecommendations: 45,
    validatedPlaces: 6,
    filteredByRating: 39,
  },
}

describe('getPlacesByCategory', () => {
  // Happy path
  it('returns correct places for must_see_attractions category', () => {
    const places = getPlacesByCategory(mockResponse, 'must_see_attractions')

    expect(places).toHaveLength(2)
    expect(places[0].name).toBe('Arenal Volcano')
    expect(places[1].name).toBe('Manuel Antonio')
  })

  it('returns correct places for outstanding_restaurants category', () => {
    const places = getPlacesByCategory(mockResponse, 'outstanding_restaurants')

    expect(places).toHaveLength(1)
    expect(places[0].name).toBe('Restaurante Silvestre')
  })

  it('returns correct places for unique_experiences category', () => {
    const places = getPlacesByCategory(mockResponse, 'unique_experiences')

    expect(places).toHaveLength(3)
    expect(places[0].name).toBe('Canopy Tour')
  })

  // Edge case: null data
  it('returns empty array when data is null', () => {
    const places = getPlacesByCategory(null, 'must_see_attractions')
    expect(places).toEqual([])
  })
})

describe('getTotalCuratedCount', () => {
  // Happy path
  it('returns correct total count', () => {
    const count = getTotalCuratedCount(mockResponse)
    expect(count).toBe(6) // 2 + 1 + 3
  })

  // Edge case: null data
  it('returns 0 when data is null', () => {
    const count = getTotalCuratedCount(null)
    expect(count).toBe(0)
  })

  // Edge case: empty sections
  it('returns 0 for empty sections', () => {
    const emptyResponse: CuratedDiscoveryResponse = {
      ...mockResponse,
      sections: {
        mustSeeAttractions: [],
        outstandingRestaurants: [],
        uniqueExperiences: [],
      },
    }

    const count = getTotalCuratedCount(emptyResponse)
    expect(count).toBe(0)
  })
})
