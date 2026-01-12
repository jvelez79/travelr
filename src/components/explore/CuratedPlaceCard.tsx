'use client'

import Image from 'next/image'
import { Star, MapPin, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AddToDropdown } from './AddToDropdown'
import type { CuratedPlace } from '@/types/curated'
import type { ItineraryDay } from '@/types/plan'

interface CuratedPlaceCardProps {
  place: CuratedPlace
  days: ItineraryDay[]
  onAddToThingsToDo: (place: CuratedPlace) => Promise<void>
  onAddToDay: (place: CuratedPlace, dayNumber: number) => Promise<void>
  onSelect?: (place: CuratedPlace) => void
  isAdded?: boolean
  isSelected?: boolean
  isHovered?: boolean
  onHover?: (place: CuratedPlace | null) => void
  className?: string
}

export function CuratedPlaceCard({
  place,
  days,
  onAddToThingsToDo,
  onAddToDay,
  onSelect,
  isAdded = false,
  isSelected = false,
  isHovered = false,
  onHover,
  className,
}: CuratedPlaceCardProps) {
  const handleClick = () => {
    onSelect?.(place)
  }

  const handleMouseEnter = () => {
    onHover?.(place)
  }

  const handleMouseLeave = () => {
    onHover?.(null)
  }

  const handleAddToThingsToDo = async () => {
    await onAddToThingsToDo(place)
  }

  const handleAddToDay = async (dayNumber: number) => {
    await onAddToDay(place, dayNumber)
  }

  return (
    <article
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'group relative bg-card rounded-2xl overflow-hidden',
        'transition-all duration-300 cursor-pointer',
        'ring-1 ring-border/50',
        isSelected && 'ring-2 ring-primary shadow-lg shadow-primary/10',
        isHovered && !isSelected && 'ring-2 ring-primary/50 shadow-md',
        !isSelected && !isHovered && 'hover:ring-primary/30 hover:shadow-md',
        className
      )}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[4/3] bg-muted overflow-hidden">
        {place.images[0] ? (
          <Image
            src={place.images[0]}
            alt={place.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized={place.images[0].includes('googleapis.com')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="w-12 h-12 rounded-xl bg-muted-foreground/10 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-muted-foreground/50" />
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* AI Confidence Badge */}
        {place.aiConfidence === 'high' && (
          <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-white text-xs font-semibold shadow-lg backdrop-blur-sm">
            <Star className="w-3 h-3 fill-current" />
            <span>Recomendado</span>
          </div>
        )}

        {/* Add Button - Top Right */}
        <div
          className="absolute top-3 right-3 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <AddToDropdown
            days={days}
            onAddToThingsToDo={handleAddToThingsToDo}
            onAddToDay={handleAddToDay}
            isAdded={isAdded}
            variant="icon-only"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {place.name}
        </h3>

        {/* Location */}
        {(place.location.city || place.location.address) && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground line-clamp-1">
              {place.location.city || place.location.address}
            </p>
          </div>
        )}

        {/* Rating Row */}
        <div className="flex items-center gap-2 mt-2">
          {place.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium text-foreground">
                {place.rating.toFixed(1)}
              </span>
              {place.reviewCount && (
                <span className="text-xs text-muted-foreground">
                  ({place.reviewCount >= 1000
                    ? `${(place.reviewCount / 1000).toFixed(1)}k`
                    : place.reviewCount.toLocaleString()})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Why Unmissable - AI Justification */}
        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2">
            <Quote className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {place.whyUnmissable}
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}

// Skeleton loader for CuratedPlaceCard
export function CuratedPlaceCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl ring-1 ring-border/50 overflow-hidden">
      {/* Image skeleton */}
      <div className="w-full aspect-[4/3] bg-muted animate-pulse" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-4 bg-muted rounded-lg w-4/5 animate-pulse" />

        {/* Location */}
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded-lg w-1/2 animate-pulse" />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded-lg w-16 animate-pulse" />
        </div>

        {/* Why unmissable */}
        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <div className="h-3 bg-muted rounded-lg w-full animate-pulse" />
          <div className="h-3 bg-muted rounded-lg w-5/6 animate-pulse" />
          <div className="h-3 bg-muted rounded-lg w-4/6 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
