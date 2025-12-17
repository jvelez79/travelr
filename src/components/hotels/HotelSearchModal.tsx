"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  X,
  ArrowUpDown,
  Loader2,
  AlertCircle,
  Search,
  Map,
  List,
} from "lucide-react"
import { HotelCardGrid, HotelCardGridSkeleton } from "./HotelCardGrid"
import { HotelDetailPanel } from "./HotelDetailPanel"
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
}: HotelSearchModalProps) {
  // Search parameters
  const [searchDestination, setSearchDestination] = useState(destination)
  const [searchCoords, setSearchCoords] = useState<Coordinates | undefined>(undefined)
  const [searchCheckIn, setSearchCheckIn] = useState(checkIn)
  const [searchCheckOut, setSearchCheckOut] = useState(checkOut)
  const [searchAdults, setSearchAdults] = useState(adults)
  const [searchChildren, setSearchChildren] = useState(children)

  // UI state
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [hoveredHotel, setHoveredHotel] = useState<HotelResult | null>(null)
  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'map'>('list')

  // Track if modal has been initialized to avoid resetting state on tab switch
  const hasInitializedRef = useRef(false)
  const prevParamsRef = useRef({ destination, checkIn, checkOut, adults, children })

  // Reset search params only on first open or when props actually change
  useEffect(() => {
    if (!open) {
      // Reset initialization flag when modal closes
      hasInitializedRef.current = false
      return
    }

    // Check if search params have actually changed
    const paramsChanged =
      prevParamsRef.current.destination !== destination ||
      prevParamsRef.current.checkIn !== checkIn ||
      prevParamsRef.current.checkOut !== checkOut ||
      prevParamsRef.current.adults !== adults ||
      prevParamsRef.current.children !== children

    // Only reset state on first open OR when params actually changed
    if (!hasInitializedRef.current || paramsChanged) {
      setSearchDestination(destination)
      setSearchCheckIn(checkIn)
      setSearchCheckOut(checkOut)
      setSearchAdults(adults)
      setSearchChildren(children)

      // Only close detail panel on first open, not on param changes
      if (!hasInitializedRef.current) {
        setShowDetailPanel(false)
      }

      hasInitializedRef.current = true
      prevParamsRef.current = { destination, checkIn, checkOut, adults, children }
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
  const { selectedHotel, selectHotel, clearSelection } = useHotelSelection(false)

  const handleAddToPlan = (hotel: HotelResult) => {
    onAddToPlan?.(hotel)
    onOpenChange(false)
  }

  const handleHotelSelect = (hotel: HotelResult) => {
    selectHotel(hotel)
    setShowDetailPanel(true)
  }

  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false)
    clearSelection()
  }

  const handleHotelHover = (hotel: HotelResult | null) => {
    setHoveredHotel(hotel)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 gap-0 overflow-hidden flex flex-col",
          // Mobile: full screen
          "w-screen h-[100dvh] max-w-none max-h-none rounded-none",
          // Tablet+: 95% viewport with rounded corners
          "md:w-[95vw] md:max-w-[95vw] md:h-[95vh] md:max-h-[95vh] md:rounded-lg"
        )}
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex flex-col gap-2 px-3 py-3 border-b border-border bg-background md:flex-row md:items-center md:justify-between md:px-6 md:py-4">
          {/* Mobile: Title first (centered) */}
          <DialogTitle className="text-base font-semibold text-center md:hidden">
            <span className="truncate">Buscar hoteles en {searchDestination}</span>
          </DialogTitle>

          {/* Mobile: Row with close button */}
          <div className="flex items-center justify-between md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Cerrar</span>
            </Button>
          </div>

          {/* Desktop: Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="gap-2 hidden md:inline-flex"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </Button>

          <DialogTitle className="text-lg font-semibold hidden md:block">
            Buscar hoteles en {searchDestination}
          </DialogTitle>

          {/* Spacer for desktop layout */}
          <div className="hidden md:block w-20" />
        </div>

        {/* Search Parameters */}
        <div className="px-3 py-3 border-b border-border bg-background space-y-3 sm:px-4 md:px-6 md:py-4">
          {/* Search input row */}
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <div className="flex-1 min-w-0">
              <DestinationSearchInput
                value={searchDestination}
                onChange={(newDestination, coords) => {
                  setSearchDestination(newDestination)
                  setSearchCoords(coords)
                }}
                placeholder="Ciudad, pais o destino..."
              />
            </div>
            <div className="flex gap-2">
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
          </div>

          {/* Filters */}
          <HotelFiltersCompact
            filters={filters}
            onFiltersChange={setFilters}
            priceRange={stats.priceRange}
            availableClasses={stats.availableClasses}
          />
        </div>

        {/* Main content: Split view with mobile toggle */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left: Hotels grid - full width on mobile, 60% on desktop */}
          <div className={cn(
            "overflow-y-auto bg-muted/30",
            "p-3 sm:p-4 md:p-6",
            "w-full md:w-[60%]",
            // Hide when in map mode on mobile
            mobileViewMode === 'map' && "hidden md:block"
          )}>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {isLoading
                  ? "Buscando hoteles..."
                  : filteredHotels.length < hotels.length
                  ? `Mostrando ${stats.filtered} de ${stats.total} hoteles`
                  : `${stats.total} hoteles encontrados`}
              </p>

              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowUpDown className="w-4 h-4" />
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
                      Calificacion: mayor a menor
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <HotelCardGridSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error al buscar hoteles</h3>
                <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
              </div>
            )}

            {/* No Results */}
            {!isLoading && !error && filteredHotels.length === 0 && hotels.length > 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No se encontraron hoteles</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Intenta ajustar los filtros para ver mas resultados.
                </p>
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                  Limpiar filtros
                </Button>
              </div>
            )}

            {/* Hotels Grid */}
            {!isLoading && !error && filteredHotels.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredHotels.map((hotel) => (
                  <HotelCardGrid
                    key={hotel.id}
                    hotel={hotel}
                    onSelect={handleHotelSelect}
                    onAddToPlan={handleAddToPlan}
                    onHover={handleHotelHover}
                    isSelected={selectedHotel?.id === hotel.id}
                    isHovered={hoveredHotel?.id === hotel.id}
                    currency={currency}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Map or Detail panel - full screen overlay on mobile */}
          <div className={cn(
            "relative",
            // Mobile: absolute full screen when in map mode
            "absolute inset-0 md:relative md:w-[40%]",
            "md:border-l md:border-border",
            // Hide when in list mode on mobile
            mobileViewMode === 'list' && "hidden md:block"
          )}>
            {showDetailPanel && selectedHotel ? (
              <div className="absolute inset-0 bg-background overflow-y-auto">
                <HotelDetailPanel
                  hotel={selectedHotel}
                  isOpen={true}
                  onClose={handleCloseDetailPanel}
                  onAddToPlan={handleAddToPlan}
                  inline={true}
                  currency={currency}
                />
              </div>
            ) : (
              <HotelMap
                hotels={filteredHotels}
                selectedHotel={selectedHotel}
                onHotelSelect={handleHotelSelect}
                currency={currency}
              />
            )}
          </div>

          {/* FAB to toggle list/map view - mobile only */}
          <Button
            onClick={() => setMobileViewMode(v => v === 'list' ? 'map' : 'list')}
            className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg md:hidden z-50"
            size="icon"
          >
            {mobileViewMode === 'list' ? (
              <Map className="w-5 h-5" />
            ) : (
              <List className="w-5 h-5" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
