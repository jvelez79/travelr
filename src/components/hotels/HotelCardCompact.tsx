"use client"

import { useState } from "react"
import { Star, MapPin, ExternalLink, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PriceComparisonDialog } from "./PriceComparisonDialog"
import type { HotelResult } from "@/lib/hotels/types"

interface HotelCardCompactProps {
  hotel: HotelResult
  onSelect?: (hotel: HotelResult) => void
  onAddToPlan?: (hotel: HotelResult) => void
  isSelected?: boolean
  currency?: string
}

export function HotelCardCompact({
  hotel,
  onSelect,
  onAddToPlan,
  isSelected = false,
  currency = "USD",
}: HotelCardCompactProps) {
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

  return (
    <div
      onClick={() => onSelect?.(hotel)}
      className={`flex gap-3 p-3 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer ${
        isSelected ? "ring-2 ring-primary border-primary" : "border-border"
      }`}
    >
      {/* Image */}
      <div className="flex-shrink-0 w-24 h-24 rounded-md overflow-hidden bg-muted">
        <img
          src={mainImage}
          alt={hotel.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1566073171259-6a40f3e01c20?w=400&q=80"
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* Top section */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm line-clamp-1">{hotel.name}</h3>
            {hotel.hotelClass && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {Array.from({ length: hotel.hotelClass }).map((_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            <MapPin className="w-3 h-3" />
            <span className="line-clamp-1">{hotel.location.area || hotel.location.address}</span>
          </div>

          {hotel.rating && (
            <div className="flex items-center gap-1 text-xs mb-2">
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                <Star className="w-3 h-3 fill-current" />
                <span className="font-semibold">{hotel.rating.toFixed(1)}</span>
              </div>
              {hotel.reviewCount && (
                <span className="text-muted-foreground">
                  ({hotel.reviewCount})
                </span>
              )}
            </div>
          )}

          {/* Amenities */}
          {hotel.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {hotel.amenities.slice(0, 3).map((amenity, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] rounded"
                >
                  {amenity}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom section - Price and actions */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-primary">
                {formatCurrency(hotel.price.perNight)}
              </span>
              {hotel.price.originalPrice && hotel.price.originalPrice > hotel.price.perNight && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatCurrency(hotel.price.originalPrice)}
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {bestOTA ? `en ${bestOTA.provider}` : "por noche"}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {/* Temporarily always show for demo - remove condition later */}
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                setShowPriceComparison(true)
              }}
              className="h-7 text-xs"
            >
              <TrendingDown className="w-3 h-3 mr-1" />
              Comparar ({hotel.bookingLinks.length})
            </Button>
            {onAddToPlan && (
              <Button
                size="sm"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddToPlan(hotel)
                }}
                className="h-7 text-xs"
              >
                Agregar
              </Button>
            )}
          </div>
        </div>

        {/* Deal badge */}
        {hotel.price.deal && (
          <Badge variant="default" className="mt-1 text-[10px] bg-green-600 hover:bg-green-700 w-fit">
            {hotel.price.deal}
          </Badge>
        )}
      </div>

      {/* Price Comparison Dialog */}
      <PriceComparisonDialog
        hotel={hotel}
        open={showPriceComparison}
        onOpenChange={setShowPriceComparison}
        currency={currency}
      />
    </div>
  )
}
