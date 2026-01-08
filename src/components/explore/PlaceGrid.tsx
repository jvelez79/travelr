"use client"

import { useState } from "react"
import Image from "next/image"
import { Star, Plus, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Place } from "@/types/explore"

interface PlaceGridProps {
  places: Place[]
  loading: boolean
  thingsToDoPlaceIds: Set<string>
  onPlaceClick: (place: Place) => void
  onAddToThingsToDo: (place: Place) => void
  addingItem: boolean
}

export function PlaceGrid({
  places,
  loading,
  thingsToDoPlaceIds,
  onPlaceClick,
  onAddToThingsToDo,
  addingItem,
}: PlaceGridProps) {
  const [addingPlaceId, setAddingPlaceId] = useState<string | null>(null)

  const handleAdd = async (place: Place, e: React.MouseEvent) => {
    e.stopPropagation()
    setAddingPlaceId(place.id)
    await onAddToThingsToDo(place)
    setAddingPlaceId(null)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <PlaceCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (places.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No places found in this category.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {places.map((place) => {
        const isInThingsToDo = thingsToDoPlaceIds.has(place.id)
        const isAdding = addingPlaceId === place.id

        return (
          <ExplorePlaceCard
            key={place.id}
            place={place}
            isInThingsToDo={isInThingsToDo}
            isAdding={isAdding}
            onClick={() => onPlaceClick(place)}
            onAdd={(e) => handleAdd(place, e)}
          />
        )
      })}
    </div>
  )
}

// Place card specifically for Explore page (with Things To Do button)
interface ExplorePlaceCardProps {
  place: Place
  isInThingsToDo: boolean
  isAdding: boolean
  onClick: () => void
  onAdd: (e: React.MouseEvent) => void
}

function ExplorePlaceCard({
  place,
  isInThingsToDo,
  isAdding,
  onClick,
  onAdd,
}: ExplorePlaceCardProps) {
  const [imageError, setImageError] = useState(false)

  const imageUrl = !imageError && place.images[0]
    ? place.images[0]
    : null

  const priceLevel = place.priceLevel
    ? '$'.repeat(place.priceLevel)
    : null

  return (
    <div
      onClick={onClick}
      className="group relative bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={place.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized={imageUrl.includes("googleapis.com")}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-muted-foreground/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Add button overlay */}
        <div className="absolute top-2 right-2 z-10">
          <Button
            size="icon"
            variant={isInThingsToDo ? "secondary" : "default"}
            className={cn(
              "h-8 w-8 rounded-full shadow-md",
              isInThingsToDo && "bg-green-500 hover:bg-green-500"
            )}
            onClick={onAdd}
            disabled={isInThingsToDo || isAdding}
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isInThingsToDo ? (
              <Check className="h-4 w-4 text-white" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Open now badge */}
        {place.openNow !== undefined && (
          <div className="absolute bottom-2 left-2">
            <span
              className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                place.openNow
                  ? "bg-green-500/90 text-white"
                  : "bg-gray-800/80 text-gray-200"
              )}
            >
              {place.openNow ? "Open" : "Closed"}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Name */}
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {place.name}
        </h3>

        {/* Rating and reviews */}
        <div className="flex items-center gap-2 mt-1">
          {place.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{place.rating.toFixed(1)}</span>
            </div>
          )}
          {place.reviewCount && (
            <span className="text-xs text-muted-foreground">
              ({place.reviewCount.toLocaleString()})
            </span>
          )}
          {priceLevel && (
            <span className="text-xs text-muted-foreground ml-auto">
              {priceLevel}
            </span>
          )}
        </div>

        {/* Subcategory */}
        {place.subcategory && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {place.subcategory}
          </p>
        )}
      </div>
    </div>
  )
}

// Skeleton for loading state
function PlaceCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}
