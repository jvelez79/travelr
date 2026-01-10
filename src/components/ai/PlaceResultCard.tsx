"use client"

import Image from "next/image"
import { Check, Plus, Star, MapPin, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PlaceSearchResult } from "@/types/ai-agent"

interface PlaceResultCardProps {
  place: PlaceSearchResult
  onAdd: () => void
  dayNumber: number
  isAdded?: boolean
}

/**
 * PlaceResultCard Component
 *
 * Compact card for displaying Google Places search results inline in the AI chat.
 * Used when the AI searches for places and presents options to the user.
 */
export function PlaceResultCard({
  place,
  onAdd,
  dayNumber,
  isAdded = false,
}: PlaceResultCardProps) {
  // Build Google Maps URL for "Ver en mapa" button
  const mapsUrl = place.location
    ? `https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}&query_place_id=${place.id}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`

  // Format price level
  const priceDisplay = place.priceLevel
    ? "$".repeat(place.priceLevel)
    : undefined

  return (
    <article
      className={cn(
        "group relative bg-card rounded-xl overflow-hidden",
        "transition-all duration-200",
        "ring-1 ring-border/50 hover:ring-primary/30 hover:shadow-md"
      )}
    >
      <div className="flex gap-3 p-3">
        {/* Image */}
        <div className="relative w-20 h-20 shrink-0 rounded-lg bg-muted overflow-hidden">
          {place.imageUrl ? (
            <Image
              src={place.imageUrl}
              alt={place.name}
              fill
              sizes="80px"
              className="object-cover"
              unoptimized={place.imageUrl.includes("googleapis.com")}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name and Category */}
          <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-1">
            {place.name}
          </h3>
          {place.category && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 capitalize">
              {place.category}
            </p>
          )}

          {/* Rating and Price */}
          <div className="flex items-center gap-2 mt-1.5">
            {place.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-xs font-medium text-foreground">
                  {place.rating.toFixed(1)}
                </span>
                {place.reviewCount && (
                  <span className="text-xs text-muted-foreground">
                    ({place.reviewCount >= 1000
                      ? `${(place.reviewCount / 1000).toFixed(1)}k`
                      : place.reviewCount})
                  </span>
                )}
              </div>
            )}
            {priceDisplay && (
              <span className="text-xs text-muted-foreground">
                • {priceDisplay}
              </span>
            )}
          </div>

          {/* Address (if available) */}
          {place.address && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {place.address}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">
            {/* Add Button */}
            <button
              onClick={onAdd}
              disabled={isAdded}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                "transition-colors",
                isAdded
                  ? "bg-emerald-500/10 text-emerald-600 cursor-default"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Agregado
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Agregar al Día {dayNumber}
                </>
              )}
            </button>

            {/* View on Map Button */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs",
                "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                "transition-colors"
              )}
            >
              <ExternalLink className="w-3 h-3" />
              Ver en mapa
            </a>
          </div>
        </div>
      </div>

      {/* Description (if available) */}
      {place.description && (
        <div className="px-3 pb-3">
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {place.description}
          </p>
        </div>
      )}
    </article>
  )
}

/**
 * Skeleton loader for PlaceResultCard
 */
export function PlaceResultCardSkeleton() {
  return (
    <div className="bg-card rounded-xl ring-1 ring-border/50 overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* Image skeleton */}
        <div className="w-20 h-20 shrink-0 rounded-lg bg-muted animate-pulse" />

        {/* Content skeleton */}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
          <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
          <div className="flex gap-2 mt-2">
            <div className="h-7 bg-muted rounded-lg w-24 animate-pulse" />
            <div className="h-7 bg-muted rounded-lg w-20 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
