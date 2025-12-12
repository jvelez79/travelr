"use client"

import { useState, useEffect } from "react"
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Loader2,
  AlertCircle,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HotelCardCompact } from "./HotelCardCompact"
import { HotelFilters } from "./HotelFilters"
import { HotelFiltersCompact } from "./HotelFiltersCompact"
import { HotelMap } from "./HotelMap"
import { DestinationSearchInput } from "@/components/shared/DestinationSearchInput"
import { DateRangePicker } from "./DateRangePicker"
import { GuestSelector } from "./GuestSelector"
import { useHotelSearch, useHotelFilters, useHotelSelection } from "@/lib/hotels"
import type { HotelResult, HotelSortOption } from "@/lib/hotels/types"
import type { Coordinates } from "@/types/explore"

interface HotelSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  destination: string
  checkIn: string
  checkOut: string
  adults: number
  children?: number
  currency?: string
  onAddToPlan?: (hotel: HotelResult) => void
  onViewDetails?: (hotel: HotelResult) => void
}

export function HotelSearchModal({
  open,
  onOpenChange,
  destination,
  checkIn,
  checkOut,
  adults,
  children,
  currency = "USD",
  onAddToPlan,
  onViewDetails,
}: HotelSearchModalProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [searchDestination, setSearchDestination] = useState(destination)
  const [searchCoords, setSearchCoords] = useState<Coordinates | undefined>(undefined)
  const [searchCheckIn, setSearchCheckIn] = useState(checkIn)
  const [searchCheckOut, setSearchCheckOut] = useState(checkOut)
  const [searchAdults, setSearchAdults] = useState(adults)
  const [searchChildren, setSearchChildren] = useState(children)

  // Reset search params when modal opens with new values
  useEffect(() => {
    if (open) {
      setSearchDestination(destination)
      setSearchCheckIn(checkIn)
      setSearchCheckOut(checkOut)
      setSearchAdults(adults)
      setSearchChildren(children)
    }
  }, [open, destination, checkIn, checkOut, adults, children])

  // Search hotels
  const {
    hotels,
    isLoading,
    error,
  } = useHotelSearch({
    destination: searchDestination,
    checkIn: searchCheckIn,
    checkOut: searchCheckOut,
    adults: searchAdults,
    children: searchChildren,
    currency,
    enabled: open,
    autoSearch: true,
  })

  // Filters and sorting
  const {
    filteredHotels,
    filters,
    sortBy,
    setFilters,
    setSortBy,
    clearFilters,
    stats,
  } = useHotelFilters({
    hotels,
    initialSortBy: "relevance",
  })

  // Selection
  const { selectedHotel, selectHotel } = useHotelSelection(false)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
    })
  }

  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  const handleAddToPlan = (hotel: HotelResult) => {
    onAddToPlan?.(hotel)
    onOpenChange(false)
  }

  // Fullscreen portal-style rendering
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Close button - top left */}
      <button
        onClick={() => onOpenChange(false)}
        className="absolute top-4 left-4 z-50 p-2 rounded-full bg-background/90 backdrop-blur-sm border border-border hover:bg-muted transition-colors shadow-lg"
        aria-label="Cerrar"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-background/95 backdrop-blur-sm space-y-3">
          {/* Search Parameters Row */}
          <div className="flex items-end gap-3">
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Buscar hoteles en
              </label>
              <DestinationSearchInput
                value={searchDestination}
                onChange={(newDestination, coords) => {
                  setSearchDestination(newDestination)
                  setSearchCoords(coords)
                }}
                placeholder="Ciudad, país o destino..."
              />
            </div>
            <DateRangePicker
              checkIn={searchCheckIn}
              checkOut={searchCheckOut}
              onDatesChange={(newCheckIn, newCheckOut) => {
                setSearchCheckIn(newCheckIn)
                setSearchCheckOut(newCheckOut)
              }}
            />
            <GuestSelector
              adults={searchAdults}
              children={searchChildren}
              onGuestsChange={(newAdults, newChildren) => {
                setSearchAdults(newAdults)
                setSearchChildren(newChildren)
              }}
            />
          </div>

          {/* Filters Row */}
          <HotelFiltersCompact
            filters={filters}
            onFiltersChange={setFilters}
            priceRange={stats.priceRange}
            availableClasses={stats.availableClasses}
          />
        </div>

        {/* Main Content: Two columns */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar: Hotels List - 40% */}
          <div className="w-2/5 border-r flex flex-col overflow-hidden bg-background">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                {filteredHotels.length < hotels.length && (
                  <span className="text-sm text-muted-foreground">
                    Mostrando {stats.filtered} de {stats.total}
                  </span>
                )}
                {filteredHotels.length === hotels.length && hotels.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {stats.total} {stats.total === 1 ? "hotel" : "hoteles"}
                  </span>
                )}
              </div>

              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <ArrowUpDown className="w-4 h-4 mr-1" />
                    Ordenar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup
                    value={sortBy}
                    onValueChange={(value) =>
                      setSortBy(value as HotelSortOption)
                    }
                  >
                    <DropdownMenuRadioItem value="relevance">
                      Relevancia
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="price_low_to_high">
                      Precio: menor a mayor
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="price_high_to_low">
                      Precio: mayor a menor
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="rating_high_to_low">
                      Calificación: mayor a menor
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="rating_low_to_high">
                      Calificación: menor a mayor
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Hotels List */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-muted-foreground">Buscando hoteles...</p>
                  <p className="text-sm text-muted-foreground">
                    Esto puede tomar unos segundos
                  </p>
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <AlertCircle className="w-10 h-10 text-destructive" />
                  <p className="text-destructive font-medium">
                    Error al buscar hoteles
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md text-center">
                    {error}
                  </p>
                </div>
              )}

              {/* No Results */}
              {!isLoading && !error && filteredHotels.length === 0 && hotels.length > 0 && (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <Search className="w-10 h-10 text-muted-foreground" />
                  <p className="font-medium">No se encontraron hoteles</p>
                  <p className="text-sm text-muted-foreground">
                    Intenta ajustar los filtros
                  </p>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                </div>
              )}

              {/* Hotels List */}
              {!isLoading && !error && filteredHotels.length > 0 && (
                <div className="space-y-2">
                  {filteredHotels.map((hotel) => (
                    <HotelCardCompact
                      key={hotel.id}
                      hotel={hotel}
                      onSelect={selectHotel}
                      onAddToPlan={handleAddToPlan}
                      isSelected={selectedHotel?.id === hotel.id}
                      currency={currency}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Map - 60% */}
          <div className="w-3/5 relative bg-muted">
            <HotelMap
              hotels={filteredHotels}
              selectedHotel={selectedHotel}
              onHotelSelect={selectHotel}
              currency={currency}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
