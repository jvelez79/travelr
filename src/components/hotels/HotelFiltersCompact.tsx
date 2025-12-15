"use client"

import { useState } from "react"
import { Star, DollarSign, SlidersHorizontal, Waves } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import type { HotelFilters } from "@/lib/hotels/types"

// Common hotel amenities for filtering
const HOTEL_AMENITIES = [
  { id: "pool", label: "Piscina", keywords: ["pool", "piscina"] },
  { id: "pet_friendly", label: "Pet Friendly", keywords: ["pet", "dog", "mascota"] },
  { id: "gym", label: "Gimnasio", keywords: ["gym", "fitness", "gimnasio"] },
  { id: "spa", label: "Spa", keywords: ["spa", "wellness"] },
  { id: "restaurant", label: "Restaurante", keywords: ["restaurant", "dining", "restaurante"] },
  { id: "wifi", label: "WiFi Gratis", keywords: ["wifi", "internet", "wi-fi"] },
  { id: "parking", label: "Estacionamiento", keywords: ["parking", "estacionamiento"] },
  { id: "breakfast", label: "Desayuno", keywords: ["breakfast", "desayuno"] },
]

interface HotelFiltersCompactProps {
  filters: HotelFilters
  onFiltersChange: (filters: HotelFilters) => void
  priceRange: { min: number; max: number }
  availableClasses: number[]
  className?: string
}

export function HotelFiltersCompact({
  filters,
  onFiltersChange,
  priceRange,
  availableClasses,
  className,
}: HotelFiltersCompactProps) {
  const [localPriceMin, setLocalPriceMin] = useState(
    filters.priceRange?.min ?? priceRange.min
  )
  const [localPriceMax, setLocalPriceMax] = useState(
    filters.priceRange?.max ?? priceRange.max
  )

  const handlePriceChange = (values: number[]) => {
    setLocalPriceMin(values[0])
    setLocalPriceMax(values[1])
  }

  const applyPriceFilter = () => {
    onFiltersChange({
      ...filters,
      priceRange: {
        min: localPriceMin,
        max: localPriceMax,
      },
    })
  }

  const toggleHotelClass = (classNum: number) => {
    const current = filters.hotelClass || []
    const updated = current.includes(classNum)
      ? current.filter((c) => c !== classNum)
      : [...current, classNum]

    onFiltersChange({
      ...filters,
      hotelClass: updated.length > 0 ? updated : undefined,
    })
  }

  const setMinRating = (rating: number) => {
    onFiltersChange({
      ...filters,
      rating: filters.rating === rating ? undefined : rating,
    })
  }

  const toggleAmenity = (amenityKeyword: string) => {
    const current = filters.amenities || []
    const updated = current.includes(amenityKeyword)
      ? current.filter((a) => a !== amenityKeyword)
      : [...current, amenityKeyword]

    onFiltersChange({
      ...filters,
      amenities: updated.length > 0 ? updated : undefined,
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const hasActiveFilters =
    filters.priceRange ||
    (filters.hotelClass && filters.hotelClass.length > 0) ||
    filters.rating ||
    (filters.amenities && filters.amenities.length > 0)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Price Range Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9">
            <DollarSign className="mr-2 h-4 w-4" />
            Precio
            {filters.priceRange && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({formatCurrency(localPriceMin)} - {formatCurrency(localPriceMax)})
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Rango de precio por noche</Label>
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>{formatCurrency(localPriceMin)}</span>
                <span>{formatCurrency(localPriceMax)}</span>
              </div>
            </div>
            <Slider
              min={priceRange.min}
              max={priceRange.max}
              step={10}
              value={[localPriceMin, localPriceMax]}
              onValueChange={handlePriceChange}
              onValueCommit={applyPriceFilter}
              className="w-full"
            />
          </div>
        </PopoverContent>
      </Popover>

      {/* Hotel Class (Stars) Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9">
            <Star className="mr-2 h-4 w-4" />
            Estrellas
            {filters.hotelClass && filters.hotelClass.length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({filters.hotelClass.length})
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Clasificación de hotel</Label>
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center space-x-2">
                <Checkbox
                  id={`stars-${stars}`}
                  checked={(filters.hotelClass || []).includes(stars)}
                  onCheckedChange={() => toggleHotelClass(stars)}
                  disabled={!availableClasses.includes(stars)}
                />
                <label
                  htmlFor={`stars-${stars}`}
                  className="text-sm flex items-center gap-1 cursor-pointer"
                >
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Rating Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9">
            <Star className="mr-2 h-4 w-4" />
            Calificación
            {filters.rating && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({filters.rating}+)
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="start">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Calificación mínima</Label>
            {[5, 4, 3, 2].map((rating) => (
              <Button
                key={rating}
                variant={filters.rating === rating ? "default" : "outline"}
                size="sm"
                className="w-full justify-start"
                onClick={() => setMinRating(rating)}
              >
                <Star className="w-3 h-3 fill-current mr-2" />
                {rating}+ estrellas
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Amenities Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9">
            <Waves className="mr-2 h-4 w-4" />
            Amenidades
            {filters.amenities && filters.amenities.length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({filters.amenities.length})
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Filtrar por amenidades</Label>
            {HOTEL_AMENITIES.map((amenity) => (
              <div key={amenity.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`amenity-${amenity.id}`}
                  checked={(filters.amenities || []).includes(amenity.keywords[0])}
                  onCheckedChange={() => toggleAmenity(amenity.keywords[0])}
                />
                <label
                  htmlFor={`amenity-${amenity.id}`}
                  className="text-sm cursor-pointer"
                >
                  {amenity.label}
                </label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setLocalPriceMin(priceRange.min)
            setLocalPriceMax(priceRange.max)
            onFiltersChange({})
          }}
          className="h-9"
        >
          Limpiar filtros
        </Button>
      )}
    </div>
  )
}
