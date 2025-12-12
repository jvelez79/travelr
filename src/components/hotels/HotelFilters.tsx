"use client"

import { useState } from "react"
import { Star, DollarSign, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import type { HotelFilters as HotelFiltersType } from "@/lib/hotels/types"
import { COMMON_AMENITIES, HOTEL_TYPES } from "@/lib/hotels/types"

interface HotelFiltersProps {
  filters: HotelFiltersType
  onFiltersChange: (filters: HotelFiltersType) => void
  priceRange: { min: number; max: number }
  availableClasses: number[]
  availableAmenities: string[]
  totalResults: number
  filteredResults: number
}

export function HotelFilters({
  filters,
  onFiltersChange,
  priceRange,
  availableClasses,
  availableAmenities,
  totalResults,
  filteredResults,
}: HotelFiltersProps) {
  const [localPriceMin, setLocalPriceMin] = useState(
    filters.priceRange?.min ?? priceRange.min
  )
  const [localPriceMax, setLocalPriceMax] = useState(
    filters.priceRange?.max ?? priceRange.max
  )

  const handlePriceRangeChange = () => {
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

  const toggleAmenity = (amenity: string) => {
    const current = filters.amenities || []
    const updated = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity]

    onFiltersChange({
      ...filters,
      amenities: updated.length > 0 ? updated : undefined,
    })
  }

  const toggleType = (type: string) => {
    const current = filters.types || []
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]

    onFiltersChange({
      ...filters,
      types: updated.length > 0 ? updated : undefined,
    })
  }

  const clearAllFilters = () => {
    setLocalPriceMin(priceRange.min)
    setLocalPriceMax(priceRange.max)
    onFiltersChange({})
  }

  const hasActiveFilters =
    filters.priceRange ||
    (filters.hotelClass && filters.hotelClass.length > 0) ||
    (filters.amenities && filters.amenities.length > 0) ||
    (filters.types && filters.types.length > 0) ||
    filters.rating

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Filtros</h3>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Results Counter */}
      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-sm">
          Mostrando <span className="font-semibold">{filteredResults}</span> de{" "}
          <span className="font-semibold">{totalResults}</span> hoteles
        </p>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <Label className="font-medium">Precio por noche</Label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={localPriceMin}
              onChange={(e) => setLocalPriceMin(Number(e.target.value))}
              onBlur={handlePriceRangeChange}
              className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
              min={priceRange.min}
              max={localPriceMax}
            />
            <span className="text-muted-foreground">-</span>
            <input
              type="number"
              value={localPriceMax}
              onChange={(e) => setLocalPriceMax(Number(e.target.value))}
              onBlur={handlePriceRangeChange}
              className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
              min={localPriceMin}
              max={priceRange.max}
            />
          </div>

          <div className="text-xs text-muted-foreground text-center">
            {formatCurrency(localPriceMin)} - {formatCurrency(localPriceMax)}
          </div>
        </div>
      </div>

      <Separator />

      {/* Hotel Class (Stars) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-muted-foreground" />
          <Label className="font-medium">Clasificación</Label>
        </div>

        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            if (!availableClasses.includes(stars)) return null

            const isChecked = filters.hotelClass?.includes(stars) || false

            return (
              <div key={stars} className="flex items-center gap-2">
                <Checkbox
                  id={`stars-${stars}`}
                  checked={isChecked}
                  onCheckedChange={() => toggleHotelClass(stars)}
                />
                <label
                  htmlFor={`stars-${stars}`}
                  className="flex items-center gap-1 cursor-pointer text-sm"
                >
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </label>
              </div>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Hotel Types */}
      <div className="space-y-3">
        <Label className="font-medium">Tipo de alojamiento</Label>

        <div className="flex flex-wrap gap-2">
          {HOTEL_TYPES.map((type) => {
            const isSelected = filters.types?.includes(type) || false

            return (
              <Badge
                key={type}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleType(type)}
              >
                {type}
              </Badge>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Amenities */}
      <div className="space-y-3">
        <Label className="font-medium">Comodidades</Label>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {COMMON_AMENITIES.map((amenity) => {
            const isChecked = filters.amenities?.includes(amenity) || false
            const isAvailable = availableAmenities.some((a) =>
              a.toLowerCase().includes(amenity.toLowerCase())
            )

            if (!isAvailable) return null

            return (
              <div key={amenity} className="flex items-center gap-2">
                <Checkbox
                  id={`amenity-${amenity}`}
                  checked={isChecked}
                  onCheckedChange={() => toggleAmenity(amenity)}
                />
                <label
                  htmlFor={`amenity-${amenity}`}
                  className="cursor-pointer text-sm"
                >
                  {amenity}
                </label>
              </div>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Rating */}
      <div className="space-y-3">
        <Label className="font-medium">Calificación mínima</Label>

        <div className="space-y-2">
          {[4.5, 4.0, 3.5, 3.0].map((rating) => {
            const isSelected = filters.rating === rating

            return (
              <div key={rating} className="flex items-center gap-2">
                <Checkbox
                  id={`rating-${rating}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => {
                    onFiltersChange({
                      ...filters,
                      rating: checked ? rating : undefined,
                    })
                  }}
                />
                <label
                  htmlFor={`rating-${rating}`}
                  className="cursor-pointer text-sm flex items-center gap-1"
                >
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {rating}+
                </label>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="font-medium text-xs text-muted-foreground">
              Filtros activos
            </Label>
            <div className="flex flex-wrap gap-1">
              {filters.priceRange && (
                <Badge variant="secondary" className="text-xs">
                  Precio: {formatCurrency(filters.priceRange.min)} -{" "}
                  {formatCurrency(filters.priceRange.max)}
                </Badge>
              )}
              {filters.hotelClass?.map((stars) => (
                <Badge key={`active-stars-${stars}`} variant="secondary" className="text-xs">
                  {stars}★
                </Badge>
              ))}
              {filters.amenities?.map((amenity) => (
                <Badge key={`active-amenity-${amenity}`} variant="secondary" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {filters.types?.map((type) => (
                <Badge key={`active-type-${type}`} variant="secondary" className="text-xs">
                  {type}
                </Badge>
              ))}
              {filters.rating && (
                <Badge variant="secondary" className="text-xs">
                  {filters.rating}★+
                </Badge>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
