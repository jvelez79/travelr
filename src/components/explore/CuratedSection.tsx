'use client'

import { useState, useCallback } from 'react'
import { ChevronDown, ChevronUp, Landmark, UtensilsCrossed, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CuratedPlaceCard, CuratedPlaceCardSkeleton } from './CuratedPlaceCard'
import type { CuratedPlace, CuratedCategoryType, CuratedCategoryInfo } from '@/types/curated'
import type { ItineraryDay } from '@/types/plan'

// Number of items to show initially
const INITIAL_VISIBLE_COUNT = 5
// Number of items to show when expanded
const EXPANDED_VISIBLE_COUNT = 15

interface CuratedSectionProps {
  category: CuratedCategoryInfo
  places: CuratedPlace[]
  days: ItineraryDay[]
  loading?: boolean
  error?: string
  // Callbacks
  onAddToThingsToDo: (place: CuratedPlace) => Promise<void>
  onAddToDay: (place: CuratedPlace, dayNumber: number) => Promise<void>
  onSelectPlace?: (place: CuratedPlace) => void
  // State
  addedPlaceIds: Set<string>
  selectedPlaceId?: string
  hoveredPlaceId?: string
  onHoverPlace?: (place: CuratedPlace | null) => void
  className?: string
}

// Icon mapping for categories
const CategoryIcon = ({ category }: { category: CuratedCategoryType }) => {
  switch (category) {
    case 'must_see_attractions':
      return <Landmark className="w-5 h-5" />
    case 'outstanding_restaurants':
      return <UtensilsCrossed className="w-5 h-5" />
    case 'unique_experiences':
      return <Sparkles className="w-5 h-5" />
    default:
      return <Landmark className="w-5 h-5" />
  }
}

export function CuratedSection({
  category,
  places,
  days,
  loading = false,
  error,
  onAddToThingsToDo,
  onAddToDay,
  onSelectPlace,
  addedPlaceIds,
  selectedPlaceId,
  hoveredPlaceId,
  onHoverPlace,
  className,
}: CuratedSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  // Determine how many items to show
  const visibleCount = isExpanded ? EXPANDED_VISIBLE_COUNT : INITIAL_VISIBLE_COUNT
  const visiblePlaces = places.slice(0, visibleCount)
  const hasMore = places.length > INITIAL_VISIBLE_COUNT
  const remainingCount = Math.min(places.length - INITIAL_VISIBLE_COUNT, EXPANDED_VISIBLE_COUNT - INITIAL_VISIBLE_COUNT)

  // Loading state
  if (loading) {
    return (
      <section className={cn('space-y-4', className)}>
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-5 w-40 bg-muted rounded-lg animate-pulse" />
            <div className="h-3 w-56 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {Array.from({ length: INITIAL_VISIBLE_COUNT }).map((_, i) => (
            <CuratedPlaceCardSkeleton key={i} />
          ))}
        </div>
      </section>
    )
  }

  // Error state
  if (error) {
    return (
      <section className={cn('space-y-4', className)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <CategoryIcon category={category.id} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{category.label}</h3>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      </section>
    )
  }

  // Empty state
  if (places.length === 0) {
    return (
      <section className={cn('space-y-4', className)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
            <CategoryIcon category={category.id} />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-muted-foreground">{category.label}</h3>
            <p className="text-sm text-muted-foreground">No se encontraron lugares en esta categoria</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <CategoryIcon category={category.id} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{category.label}</h3>
            <p className="text-sm text-muted-foreground">
              {category.description} ({places.length} lugares)
            </p>
          </div>
        </div>
      </div>

      {/* Places Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {visiblePlaces.map((place) => (
          <CuratedPlaceCard
            key={place.id}
            place={place}
            days={days}
            onAddToThingsToDo={onAddToThingsToDo}
            onAddToDay={onAddToDay}
            onSelect={onSelectPlace}
            isAdded={addedPlaceIds.has(place.id)}
            isSelected={selectedPlaceId === place.id}
            isHovered={hoveredPlaceId === place.id}
            onHover={onHoverPlace}
          />
        ))}
      </div>

      {/* Ver todos / Ver menos button */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpand}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Ver menos
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Ver todos (+{remainingCount})
              </>
            )}
          </Button>
        </div>
      )}
    </section>
  )
}
