/**
 * Tests for CuratedPlaceCard component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CuratedPlaceCard } from '../CuratedPlaceCard'
import type { CuratedPlace } from '@/types/curated'
import type { ItineraryDay } from '@/types/plan'

// Mock place data
const mockPlace: CuratedPlace = {
  id: 'ChIJ12345',
  name: 'Arenal Volcano National Park',
  category: 'nature',
  location: {
    lat: 10.4626,
    lng: -84.7032,
    address: 'La Fortuna, Costa Rica',
    city: 'La Fortuna',
    country: 'Costa Rica',
  },
  rating: 4.8,
  reviewCount: 15234,
  images: ['https://example.com/image1.jpg'],
  whyUnmissable: 'El volcan activo mas famoso de Costa Rica con vistas espectaculares y aguas termales naturales.',
  curatedCategory: 'must_see_attractions',
  validatedAt: '2026-01-11T00:00:00.000Z',
  aiConfidence: 'high',
}

const mockDays: ItineraryDay[] = [
  {
    day: 1,
    date: '2026-12-07',
    title: 'Dia 1: Llegada',
    timeline: [],
    meals: {},
    importantNotes: [],
    transport: '',
    overnight: '',
  },
  {
    day: 2,
    date: '2026-12-08',
    title: 'Dia 2: Arenal',
    timeline: [{
      id: 'tl-1',
      time: '9:00 AM',
      activity: 'Hiking',
      location: 'Arenal',
    }],
    meals: {},
    importantNotes: [],
    transport: '',
    overnight: '',
  },
]

describe('CuratedPlaceCard', () => {
  // Happy path test
  it('renders place information correctly', () => {
    const onAddToThingsToDo = vi.fn()
    const onAddToDay = vi.fn()

    render(
      <CuratedPlaceCard
        place={mockPlace}
        days={mockDays}
        onAddToThingsToDo={onAddToThingsToDo}
        onAddToDay={onAddToDay}
      />
    )

    // Check name is rendered
    expect(screen.getByText('Arenal Volcano National Park')).toBeInTheDocument()

    // Check location is rendered
    expect(screen.getByText('La Fortuna')).toBeInTheDocument()

    // Check rating is rendered
    expect(screen.getByText('4.8')).toBeInTheDocument()

    // Check "why unmissable" justification is rendered
    expect(screen.getByText(/El volcan activo mas famoso/)).toBeInTheDocument()

    // Check AI recommendation badge for high confidence
    expect(screen.getByText('Recomendado')).toBeInTheDocument()
  })

  // Edge case: place without rating
  it('handles place without rating gracefully', () => {
    const placeWithoutRating: CuratedPlace = {
      ...mockPlace,
      rating: undefined,
      reviewCount: undefined,
    }

    const onAddToThingsToDo = vi.fn()
    const onAddToDay = vi.fn()

    render(
      <CuratedPlaceCard
        place={placeWithoutRating}
        days={mockDays}
        onAddToThingsToDo={onAddToThingsToDo}
        onAddToDay={onAddToDay}
      />
    )

    // Should still render the card without crashing
    expect(screen.getByText('Arenal Volcano National Park')).toBeInTheDocument()

    // Rating should not be present
    expect(screen.queryByText('4.8')).not.toBeInTheDocument()
  })

  // Test that card is clickable
  it('calls onSelect when card is clicked', () => {
    const onAddToThingsToDo = vi.fn()
    const onAddToDay = vi.fn()
    const onSelect = vi.fn()

    render(
      <CuratedPlaceCard
        place={mockPlace}
        days={mockDays}
        onAddToThingsToDo={onAddToThingsToDo}
        onAddToDay={onAddToDay}
        onSelect={onSelect}
      />
    )

    // Click on the card (article element)
    const card = screen.getByRole('article')
    fireEvent.click(card)

    expect(onSelect).toHaveBeenCalledWith(mockPlace)
  })

  // Test selected state styling
  it('applies selected styling when isSelected is true', () => {
    const onAddToThingsToDo = vi.fn()
    const onAddToDay = vi.fn()

    render(
      <CuratedPlaceCard
        place={mockPlace}
        days={mockDays}
        onAddToThingsToDo={onAddToThingsToDo}
        onAddToDay={onAddToDay}
        isSelected={true}
      />
    )

    const card = screen.getByRole('article')
    expect(card).toHaveClass('ring-2', 'ring-primary')
  })
})
