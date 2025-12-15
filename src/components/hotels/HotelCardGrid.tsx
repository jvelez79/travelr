"use client"

import Image from "next/image"
import { useState } from "react"
import { Star, MapPin, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PriceComparisonDialog } from "./PriceComparisonDialog"
import type { HotelResult } from "@/lib/hotels/types"

interface HotelCardGridProps {
  hotel: HotelResult
  onSelect?: (hotel: HotelResult) => void
  onAddToPlan?: (hotel: HotelResult) => void
  onHover?: (hotel: HotelResult | null) => void
  isSelected?: boolean
  isHovered?: boolean
  currency?: string
}

export function HotelCardGrid({
  hotel,
  onSelect,
  onAddToPlan,
  onHover,
  isSelected = false,
  isHovered = false,
  currency = "USD",
}: HotelCardGridProps) {
  const [showPriceComparison, setShowPriceComparison] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const mainImage = hotel.images[0] || "https://images.unsplash.com/photo-1566073171259-6a40f3e01c20?w=400&q=80"

  // Find best price from booking links
  const bestPrice = hotel.bookingLinks.length > 0
    ? Math.min(...hotel.bookingLinks.map(l => l.price))
    : hotel.price.perNight

  const bestOTA = hotel.bookingLinks.find(l => l.price === bestPrice)

  const handleClick = () => {
    onSelect?.(hotel)
  }

  const handleMouseEnter = () => {
    onHover?.(hotel)
  }

  const handleMouseLeave = () => {
    onHover?.(null)
  }

  return (
    <>
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
          <Image
            src={mainImage}
            alt={hotel.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1566073171259-6a40f3e01c20?w=400&q=80"
            }}
            unoptimized
          />

          {/* Hotel Class Badge */}
          {hotel.hotelClass && (
            <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-0.5 px-2 py-1 rounded-full bg-black/70 text-white text-xs font-semibold shadow-lg">
              {Array.from({ length: hotel.hotelClass }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              ))}
            </span>
          )}

          {/* Deal Badge */}
          {hotel.price.deal && (
            <Badge
              variant="default"
              className="absolute top-3 right-3 z-10 text-[10px] bg-green-600 hover:bg-green-700"
            >
              {hotel.price.deal}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Name */}
          <h3 className="font-semibold text-base text-foreground leading-tight line-clamp-1">
            {hotel.name}
          </h3>

          {/* Type & Location */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
            <span>{hotel.type}</span>
            {hotel.location.area && (
              <>
                <span>•</span>
                <MapPin className="w-3 h-3" />
                <span className="line-clamp-1">{hotel.location.area}</span>
              </>
            )}
          </div>

          {/* Rating */}
          {hotel.rating && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-sm font-semibold">{hotel.rating.toFixed(1)}</span>
              </div>
              {hotel.reviewCount && (
                <span className="text-sm text-muted-foreground">
                  ({hotel.reviewCount.toLocaleString()} reviews)
                </span>
              )}
            </div>
          )}

          {/* Amenities */}
          {hotel.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {hotel.amenities.slice(0, 4).map((amenity, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-md"
                >
                  {amenity}
                </span>
              ))}
              {hotel.amenities.length > 4 && (
                <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-md">
                  +{hotel.amenities.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Price Section */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(hotel.price.perNight)}
                </span>
                {hotel.price.originalPrice && hotel.price.originalPrice > hotel.price.perNight && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatCurrency(hotel.price.originalPrice)}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {bestOTA ? `en ${bestOTA.provider}` : "por noche"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {hotel.bookingLinks.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowPriceComparison(true)
                  }}
                  className="h-8 text-xs"
                >
                  <TrendingDown className="w-3 h-3 mr-1" />
                  Comparar
                </Button>
              )}
              {onAddToPlan && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddToPlan(hotel)
                  }}
                  className="h-8 text-xs"
                >
                  Agregar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Price Comparison Dialog */}
      <PriceComparisonDialog
        hotel={hotel}
        open={showPriceComparison}
        onOpenChange={setShowPriceComparison}
        currency={currency}
      />
    </>
  )
}

// Skeleton loader for HotelCardGrid
export function HotelCardGridSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="w-full aspect-[16/10] bg-muted" />

      {/* Content skeleton */}
      <div className="p-4">
        {/* Title */}
        <div className="h-5 bg-muted rounded w-3/4" />

        {/* Type & Location */}
        <div className="h-4 bg-muted rounded w-1/2 mt-2" />

        {/* Rating */}
        <div className="flex items-center gap-2 mt-3">
          <div className="h-6 bg-muted rounded w-16" />
          <div className="h-4 bg-muted rounded w-20" />
        </div>

        {/* Amenities */}
        <div className="flex gap-1 mt-3">
          <div className="h-5 bg-muted rounded w-12" />
          <div className="h-5 bg-muted rounded w-14" />
          <div className="h-5 bg-muted rounded w-10" />
        </div>

        {/* Price section */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <div>
            <div className="h-6 bg-muted rounded w-20" />
            <div className="h-3 bg-muted rounded w-16 mt-1" />
          </div>
          <div className="h-8 bg-muted rounded w-24" />
        </div>
      </div>
    </div>
  )
}
