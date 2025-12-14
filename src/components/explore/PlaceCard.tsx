"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Place } from "@/types/explore"
import { getPlaceBadge, getPrimaryInsight, type PlaceBadge } from "@/lib/places/scoring"

interface PlaceCardProps {
  place: Place
  onAdd: (place: Place) => void
  onSelect?: (place: Place) => void
  onHover?: (place: Place | null) => void
  isSelected?: boolean
  isHovered?: boolean
  categoryRank?: number
  dayNumber: number
  mode?: 'add' | 'replace'
}

function BadgeDisplay({ badge }: { badge: PlaceBadge }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`absolute top-3 left-3 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-semibold shadow-lg ${badge.color}`}
          >
            <span>{badge.emoji}</span>
            <span className="hidden sm:inline">{badge.label}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <p className="text-sm">{badge.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function PriceLevel({ level }: { level?: number }) {
  if (!level) return null
  return (
    <span className="text-sm">
      <span className="text-foreground font-medium">{"$".repeat(level)}</span>
      <span className="text-muted-foreground/40">{"$".repeat(4 - level)}</span>
    </span>
  )
}

export function PlaceCard({
  place,
  onAdd,
  onSelect,
  onHover,
  isSelected = false,
  isHovered = false,
  categoryRank,
  dayNumber,
  mode = 'add',
}: PlaceCardProps) {
  const badge = getPlaceBadge(place, categoryRank)
  const insight = getPrimaryInsight(place, categoryRank)

  const handleClick = () => {
    onSelect?.(place)
  }

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAdd(place)
  }

  const handleMouseEnter = () => {
    onHover?.(place)
  }

  const handleMouseLeave = () => {
    onHover?.(null)
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        group relative bg-card rounded-xl border overflow-hidden
        transition-all duration-200 cursor-pointer
        ${isSelected
          ? "ring-2 ring-primary border-primary shadow-lg"
          : isHovered
          ? "ring-2 ring-primary/50 border-primary/50 shadow-md"
          : "border-border hover:border-primary/50 hover:shadow-md"
        }
      `}
    >
      {/* Image */}
      <div className="relative w-full aspect-[16/10] bg-muted overflow-hidden">
        {place.images[0] ? (
          <Image
            src={place.images[0]}
            alt={place.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized={place.images[0].includes("googleapis.com")}
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

        {/* Badge overlay */}
        {badge && <BadgeDisplay badge={badge} />}

        {/* Open now indicator */}
        {place.openNow !== undefined && (
          <span
            className={`absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full text-xs font-medium ${
              place.openNow
                ? "bg-green-500/90 text-white"
                : "bg-gray-800/80 text-gray-200"
            }`}
          >
            {place.openNow ? "Abierto" : "Cerrado"}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <h3 className="font-semibold text-base text-foreground leading-tight line-clamp-1">
          {place.name}
        </h3>

        {/* Subcategory */}
        {place.subcategory && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
            {place.subcategory}
          </p>
        )}

        {/* Rating and Price */}
        <div className="flex items-center gap-2 mt-2">
          {place.rating && (
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4 text-amber-400 fill-amber-400"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-semibold">{place.rating.toFixed(1)}</span>
              {place.reviewCount && (
                <span className="text-sm text-muted-foreground">
                  ({place.reviewCount.toLocaleString()})
                </span>
              )}
            </div>
          )}
          {place.rating && place.priceLevel && (
            <span className="text-muted-foreground">•</span>
          )}
          <PriceLevel level={place.priceLevel} />
        </div>

        {/* Description */}
        {place.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {place.description}
          </p>
        )}

        {/* Insight */}
        {insight && (
          <div className="flex items-start gap-2 mt-3 p-2.5 bg-primary/5 border border-primary/10 rounded-lg">
            <span className="text-primary flex-shrink-0">💡</span>
            <p className="text-xs text-primary/90 leading-relaxed">{insight}</p>
          </div>
        )}

        {/* Add/Select button */}
        <Button
          onClick={handleAdd}
          className="w-full mt-3"
          variant="default"
        >
          {mode === 'replace' ? (
            <>
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Seleccionar
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Agregar al Día {dayNumber}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Skeleton loader for PlaceCard
export function PlaceCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="w-full aspect-[16/10] bg-muted" />

      {/* Content skeleton */}
      <div className="p-4">
        {/* Title */}
        <div className="h-5 bg-muted rounded w-3/4" />

        {/* Subcategory */}
        <div className="h-4 bg-muted rounded w-1/2 mt-2" />

        {/* Rating */}
        <div className="flex items-center gap-2 mt-3">
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-16" />
        </div>

        {/* Description */}
        <div className="space-y-1.5 mt-3">
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>

        {/* Button */}
        <div className="h-9 bg-muted rounded w-full mt-4" />
      </div>
    </div>
  )
}
