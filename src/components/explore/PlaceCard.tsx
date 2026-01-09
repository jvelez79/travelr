"use client"

import Image from "next/image"
import { Check, Plus, Star, Sparkles, TrendingUp, Award } from "lucide-react"
import type { Place } from "@/types/explore"
import { cn } from "@/lib/utils"

interface PlaceCardProps {
  place: Place
  onAdd: (place: Place) => void
  onSelect?: (place: Place) => void
  onHover?: (place: Place | null) => void
  isSelected?: boolean
  isHovered?: boolean
  isAdded?: boolean
  categoryRank?: number
  dayNumber?: number
  mode?: 'add' | 'replace'
}

type QualityTier = 'exceptional' | 'excellent' | 'great' | 'good'

// Calculate quality tier based on rating and reviews
function getQualityTier(rating: number | undefined, reviewCount: number | undefined): {
  tier: QualityTier
  label: string
  icon: React.ReactNode
} | null {
  if (!rating) return null

  const reviews = reviewCount || 0

  // Exceptional: 4.8+ with significant reviews
  if (rating >= 4.8 && reviews >= 500) {
    return {
      tier: 'exceptional',
      label: 'Excepcional',
      icon: <Award className="w-3 h-3" />
    }
  }

  // Excellent: 4.5+ with good reviews
  if (rating >= 4.5 && reviews >= 100) {
    return {
      tier: 'excellent',
      label: 'Excelente',
      icon: <Sparkles className="w-3 h-3" />
    }
  }

  // Great: 4.3+
  if (rating >= 4.3 && reviews >= 50) {
    return {
      tier: 'great',
      label: 'Muy bueno',
      icon: <TrendingUp className="w-3 h-3" />
    }
  }

  return null
}

const tierStyles: Record<QualityTier, string> = {
  exceptional: 'bg-amber-500 text-white',
  excellent: 'bg-primary text-white',
  great: 'bg-slate-700 text-white',
  good: 'bg-slate-600 text-slate-200',
}

export function PlaceCard({
  place,
  onAdd,
  onSelect,
  onHover,
  isSelected = false,
  isHovered = false,
  isAdded = false,
  dayNumber,
}: PlaceCardProps) {
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

  const qualityTier = getQualityTier(place.rating, place.reviewCount)

  return (
    <article
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group relative bg-card rounded-2xl overflow-hidden",
        "transition-all duration-300 cursor-pointer",
        "ring-1 ring-border/50",
        isSelected && "ring-2 ring-primary shadow-lg shadow-primary/10",
        isHovered && !isSelected && "ring-2 ring-primary/50 shadow-md",
        !isSelected && !isHovered && "hover:ring-primary/30 hover:shadow-md"
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
            unoptimized={place.images[0].includes("googleapis.com")}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="w-12 h-12 rounded-xl bg-muted-foreground/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-muted-foreground/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Quality Badge - Top Left */}
        {qualityTier && (
          <div
            className={cn(
              "absolute top-3 left-3 z-10",
              "inline-flex items-center gap-1 px-2 py-1 rounded-full",
              "text-xs font-semibold",
              "shadow-lg backdrop-blur-sm",
              tierStyles[qualityTier.tier]
            )}
          >
            {qualityTier.icon}
            <span>{qualityTier.label}</span>
          </div>
        )}

        {/* Add Button - Top Right */}
        <button
          onClick={handleAdd}
          className={cn(
            "absolute top-3 right-3 z-10",
            "w-9 h-9 rounded-full",
            "flex items-center justify-center",
            "transition-all duration-200",
            "shadow-lg backdrop-blur-sm",
            isAdded
              ? "bg-emerald-500 text-white"
              : "bg-white/90 text-slate-700 hover:bg-primary hover:text-white hover:scale-110"
          )}
          aria-label={isAdded ? "Ya agregado" : `Agregar ${place.name} al Día ${dayNumber || 1}`}
        >
          {isAdded ? (
            <Check className="w-4 h-4" strokeWidth={2.5} />
          ) : (
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {place.name}
        </h3>

        {/* Category/Type - Subtle */}
        {place.subcategory && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {place.subcategory}
          </p>
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

        {/* Quick Add CTA - Shows on hover */}
        <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleAdd}
            className={cn(
              "w-full py-2 rounded-lg text-sm font-medium transition-colors",
              isAdded
                ? "bg-emerald-500/10 text-emerald-600 cursor-default"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {isAdded ? (
              <span className="flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                Agregado
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <Plus className="w-4 h-4" />
                Agregar al Día {dayNumber || 1}
              </span>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}

// Skeleton loader for PlaceCard
export function PlaceCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl ring-1 ring-border/50 overflow-hidden">
      {/* Image skeleton */}
      <div className="w-full aspect-[4/3] bg-muted animate-pulse" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-4 bg-muted rounded-lg w-4/5 animate-pulse" />

        {/* Category */}
        <div className="h-3 bg-muted rounded-lg w-1/2 animate-pulse" />

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 bg-muted rounded animate-pulse" />
          <div className="h-3 bg-muted rounded-lg w-20 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
