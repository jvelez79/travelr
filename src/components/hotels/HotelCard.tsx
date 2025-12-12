"use client"

import { useState } from "react"
import { Star, MapPin, Heart, ExternalLink, ChevronDown, ChevronUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PriceComparisonDialog } from "./PriceComparisonDialog"
import type { HotelResult } from "@/lib/hotels/types"

interface HotelCardProps {
  hotel: HotelResult
  onSelect?: (hotel: HotelResult) => void
  onAddToPlan?: (hotel: HotelResult) => void
  onViewDetails?: (hotel: HotelResult) => void
  isSelected?: boolean
  isFavorite?: boolean
  onToggleFavorite?: (hotelId: string) => void
  currency?: string
}

export function HotelCard({
  hotel,
  onSelect,
  onAddToPlan,
  onViewDetails,
  isSelected = false,
  isFavorite = false,
  onToggleFavorite,
  currency = "USD",
}: HotelCardProps) {
  const [showAllImages, setShowAllImages] = useState(false)
  const [showPriceComparison, setShowPriceComparison] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const mainImage = hotel.images[0] || "https://images.unsplash.com/photo-1566073171259-6a40f3e01c20?w=400&q=80"
  const hasMoreImages = hotel.images.length > 1

  // Find best price from booking links
  const bestPrice = hotel.bookingLinks.length > 0
    ? Math.min(...hotel.bookingLinks.map(l => l.price))
    : hotel.price.perNight

  const bestOTA = hotel.bookingLinks.find(l => l.price === bestPrice)

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-lg ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
    >
      <div className="relative">
        {/* Main Image */}
        <div className="relative h-48 overflow-hidden bg-muted">
          <img
            src={mainImage}
            alt={hotel.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1566073171259-6a40f3e01c20?w=400&q=80"
            }}
          />

          {/* Favorite Button */}
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(hotel.id)
              }}
              className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-all"
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
                }`}
              />
            </button>
          )}

          {/* Deal Badge */}
          {hotel.price.deal && (
            <div className="absolute top-2 left-2">
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                {hotel.price.deal}
              </Badge>
            </div>
          )}

          {/* Hotel Class */}
          {hotel.hotelClass && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="bg-white/90">
                <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                {hotel.hotelClass}
              </Badge>
            </div>
          )}
        </div>

        {/* Additional Images */}
        {hasMoreImages && (
          <div className="relative">
            <button
              onClick={() => setShowAllImages(!showAllImages)}
              className="w-full py-1 bg-muted/50 hover:bg-muted text-xs text-muted-foreground flex items-center justify-center gap-1"
            >
              {showAllImages ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Ocultar fotos
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Ver más fotos ({hotel.images.length - 1})
                </>
              )}
            </button>

            {showAllImages && (
              <div className="grid grid-cols-3 gap-1 p-2 bg-muted/30">
                {hotel.images.slice(1, 7).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`${hotel.name} - ${i + 2}`}
                    className="w-full h-20 object-cover rounded"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Hotel Type */}
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline">{hotel.type}</Badge>
          {hotel.rating && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{hotel.rating.toFixed(1)}</span>
              {hotel.reviewCount && (
                <span className="text-muted-foreground">
                  ({hotel.reviewCount})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Hotel Name */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{hotel.name}</h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span className="line-clamp-1">
            {hotel.location.area || hotel.location.address}
          </span>
        </div>

        {/* Amenities */}
        {hotel.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {hotel.amenities.slice(0, 3).map((amenity, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
              >
                {amenity}
              </span>
            ))}
            {hotel.amenities.length > 3 && (
              <span className="px-2 py-0.5 text-muted-foreground text-xs">
                +{hotel.amenities.length - 3} más
              </span>
            )}
          </div>
        )}

        {/* Check-in/out times */}
        {(hotel.checkInTime || hotel.checkOutTime) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {hotel.checkInTime && <span>Check-in: {hotel.checkInTime}</span>}
            {hotel.checkOutTime && <span>Check-out: {hotel.checkOutTime}</span>}
          </div>
        )}

        {/* Price Section */}
        <div className="border-t pt-3 mt-3">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Por noche</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(hotel.price.perNight)}
              </p>
              {hotel.price.originalPrice && hotel.price.originalPrice > hotel.price.perNight && (
                <p className="text-xs text-muted-foreground line-through">
                  {formatCurrency(hotel.price.originalPrice)}
                </p>
              )}
            </div>

            {bestOTA && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Mejor precio en</p>
                <p className="text-sm font-semibold">{bestOTA.provider}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Compare Prices Button */}
            {hotel.bookingLinks.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPriceComparison(true)}
                className="flex-1"
              >
                <TrendingDown className="w-3 h-3 mr-1" />
                Comparar precios ({hotel.bookingLinks.length})
              </Button>
            )}

            {onAddToPlan && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onAddToPlan(hotel)}
                className="flex-1"
              >
                Agregar al plan
              </Button>
            )}

            {bestOTA && !hotel.bookingLinks.length && (
              <Button
                variant="default"
                size="sm"
                asChild
                className="flex-1"
              >
                <a
                  href={bestOTA.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  Reservar
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {/* Price Comparison Dialog */}
      <PriceComparisonDialog
        hotel={hotel}
        open={showPriceComparison}
        onOpenChange={setShowPriceComparison}
        currency={currency}
      />
    </Card>
  )
}
