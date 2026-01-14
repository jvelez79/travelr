/**
 * SearchResultCard Component
 *
 * Individual card in the search results grid.
 * Includes image, info, hover state, and add button.
 */

"use client"

import Image from "next/image"
import { Star, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { DaySelectorDropdown } from "@/components/ai/DaySelectorDropdown"
import type { Place } from "@/types/explore"
import type { ItineraryDay } from "@/types/plan"

interface SearchResultCardProps {
  place: Place
  index: number // For number badge (1-indexed)
  isHovered: boolean
  isSelected: boolean
  isAdded: boolean
  onHover: () => void
  onUnhover: () => void
  onClick: () => void
  onAddToThingsToDo: () => Promise<void>
  onAddToDay: (dayNumber: number) => Promise<void>
  days: ItineraryDay[]
}

export function SearchResultCard({
  place,
  index,
  isHovered,
  isSelected,
  isAdded,
  onHover,
  onUnhover,
  onClick,
  onAddToThingsToDo,
  onAddToDay,
  days,
}: SearchResultCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden bg-card border transition-all cursor-pointer",
        isHovered && "ring-2 ring-primary shadow-lg scale-[1.02]",
        isSelected && "ring-2 ring-primary"
      )}
      onMouseEnter={onHover}
      onMouseLeave={onUnhover}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted">
        {place.images?.[0] ? (
          <Image
            src={place.images[0]}
            alt={place.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}

        {/* Number badge */}
        <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center text-xs font-bold shadow-sm">
          {index + 1}
        </div>

        {/* Add button */}
        <div
          className="absolute top-1.5 right-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {isAdded ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
          ) : (
            <DaySelectorDropdown
              days={days}
              onSelectDay={onAddToDay}
              onAddToThingsToDo={onAddToThingsToDo}
              className="scale-90"
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-2">
        <h3 className="font-medium text-xs truncate">{place.name}</h3>
        {place.subcategory && (
          <p className="text-xs text-muted-foreground truncate">
            {place.subcategory}
          </p>
        )}
        {place.rating && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium">{place.rating.toFixed(1)}</span>
            {place.reviewCount && (
              <span className="text-[10px] text-muted-foreground">
                ({place.reviewCount.toLocaleString()})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
