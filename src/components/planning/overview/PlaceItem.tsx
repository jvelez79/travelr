"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Trash2, CalendarPlus, MapPin, ExternalLink, Star } from "lucide-react"
import { getGoogleMapsUrl } from "@/lib/places"
import { PlaceHoverCard } from "@/components/planning/editor/PlaceHoverCard"
import type { SavedPlace } from "@/types/plan"

interface PlaceItemProps {
  place: SavedPlace
  index: number
  onDelete?: (id: string) => void
  onAddToItinerary?: (place: SavedPlace) => void
}

function PriceLevel({ level }: { level?: number }) {
  if (!level) return null
  return (
    <span className="text-xs text-muted-foreground">
      {"$".repeat(level)}
    </span>
  )
}

export function PlaceItem({ place, index, onDelete, onAddToItinerary }: PlaceItemProps) {
  const [showHoverCard, setShowHoverCard] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const googleMapsUrl = getGoogleMapsUrl(place)
  const hasImage = place.images && place.images.length > 0

  // Check if place has a Google Place ID (either legacy or new format)
  const hasPlaceId = Boolean(place.placeId || place.sourceInfo?.sourceId)

  // Handle hover with short delay
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!hasPlaceId) return
    setMousePosition({ x: e.clientX, y: e.clientY })
    hoverTimeoutRef.current = setTimeout(() => {
      setShowHoverCard(true)
    }, 150) // Short delay for smoother UX
  }

  const handleMouseLeave = (e: React.MouseEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget?.closest('[data-place-hover-card]')) {
      return
    }
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setShowHoverCard(false)
  }

  return (
    <div
      className="relative flex gap-3 py-3 group border-b border-border/50 last:border-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hover card popover - fixed position near mouse entry point */}
      {showHoverCard && hasPlaceId && (
        <PlaceHoverCard
          savedPlace={place}
          mousePosition={mousePosition}
          onMouseLeave={() => setShowHoverCard(false)}
        />
      )}
      {/* Image or number badge */}
      {hasImage ? (
        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={place.images![0]}
            alt={place.name}
            fill
            sizes="64px"
            className="object-cover"
            unoptimized={place.images![0].includes("googleapis.com")}
          />
          {/* Number overlay */}
          <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-sm">
            {index + 1}
          </div>
        </div>
      ) : (
        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
            {index + 1}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {/* Name + Google Maps link */}
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-sm truncate">{place.name}</p>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
                title="Ver en Google Maps"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Rating, Price, Category */}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {place.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-medium">{place.rating.toFixed(1)}</span>
                  {place.reviewCount && (
                    <span className="text-xs text-muted-foreground">
                      ({place.reviewCount.toLocaleString()})
                    </span>
                  )}
                </div>
              )}
              <PriceLevel level={place.priceLevel} />
              {place.subcategory && (
                <span className="text-xs text-muted-foreground">
                  {place.subcategory}
                </span>
              )}
              {!place.subcategory && place.category && (
                <span className="text-xs text-muted-foreground capitalize">
                  {place.category}
                </span>
              )}
            </div>

            {/* Description */}
            {place.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {place.description}
              </p>
            )}

            {/* Location */}
            {place.location?.city && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {place.location.address || place.location.city}
                  {place.location.country && `, ${place.location.country}`}
                </span>
              </div>
            )}
          </div>

          {/* Day badge if added to itinerary */}
          {place.addedToItineraryDay && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
              Dia {place.addedToItineraryDay}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onAddToItinerary && !place.addedToItineraryDay && (
          <button
            onClick={() => onAddToItinerary(place)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Agregar al itinerario"
          >
            <CalendarPlus className="w-4 h-4 text-muted-foreground hover:text-primary" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(place.id)}
            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        )}
      </div>
    </div>
  )
}
