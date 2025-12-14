"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Search, X, Star, Clock, Filter, Loader2, Map, List } from "lucide-react"
import { DiscoveryChips } from "./DiscoveryChips"
import { PlaceCard, PlaceCardSkeleton } from "./PlaceCard"
import { ExploreMap } from "./ExploreMap"
import { PlaceDetailPanel } from "./PlaceDetailPanel"
import { usePlaces, usePlaceSearch } from "@/lib/explore/hooks"
import type {
  Place,
  PlaceCategory,
  Coordinates,
  ExploreModalProps,
  DiscoveryChip,
} from "@/types/explore"
import { DISCOVERY_CHIPS } from "@/types/explore"
import {
  sortByHiddenGemScore,
  sortByOverallQuality,
  filterByMinRating,
} from "@/lib/places/scoring"

// Geocode a location name to coordinates using the destinations API
async function geocodeLocation(locationName: string): Promise<Coordinates | null> {
  try {
    // Step 1: Get autocomplete suggestions
    const response = await fetch(`/api/explore/destinations?q=${encodeURIComponent(locationName)}`)
    if (!response.ok) return null

    const data = await response.json()
    if (!data.suggestions?.[0]?.placeId) return null

    // Step 2: Get location info from place ID
    const infoResponse = await fetch(`/api/explore/destinations?placeId=${data.suggestions[0].placeId}`)
    if (!infoResponse.ok) return null

    const info = await infoResponse.json()
    if (info.location?.lat && info.location?.lng) {
      return info.location
    }

    return null
  } catch (error) {
    console.error("Error geocoding location:", error)
    return null
  }
}

// Accommodation info for showing on map
interface DayAccommodation {
  name: string
  location: Coordinates
}

interface ExploreModalInternalProps extends ExploreModalProps {
  availableDays?: { number: number; location: string }[]
  // Day's accommodation to show on map as reference point
  dayAccommodation?: DayAccommodation
  // Callback for creating custom activity
  onCreateCustomActivity?: (dayNumber: number) => void
}

export function ExploreModal({
  isOpen,
  onClose,
  dayNumber,
  dayLocation,
  tripDestination,
  mode = 'add',
  activityName,
  onAddPlace,
  initialCategory,
  initialSearchQuery,
  availableDays = [],
  dayAccommodation,
  onCreateCustomActivity,
}: ExploreModalInternalProps) {
  // State
  const [selectedDay, setSelectedDay] = useState(dayNumber)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || "")
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory>(
    initialCategory || "attractions"
  )
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [hoveredPlace, setHoveredPlace] = useState<Place | null>(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [minRating, setMinRating] = useState<number | null>(null)
  const [openNowFilter, setOpenNowFilter] = useState(false)
  // Mobile view toggle: 'list' or 'map'
  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'map'>('list')

  // Geocoding state
  const [locationCoords, setLocationCoords] = useState<Coordinates | null>(null)
  const [coordsLoading, setCoordsLoading] = useState(true)

  // Geocode location when modal opens or dayLocation changes
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setCoordsLoading(true)
      setLocationCoords(null)
      return
    }

    async function fetchCoords() {
      setCoordsLoading(true)

      // Try dayLocation first
      let coords = await geocodeLocation(dayLocation)

      // Fallback to tripDestination if dayLocation geocoding fails
      if (!coords && tripDestination && tripDestination !== dayLocation) {
        coords = await geocodeLocation(tripDestination)
      }

      setLocationCoords(coords)
      setCoordsLoading(false)
    }

    fetchCoords()
  }, [isOpen, dayLocation, tripDestination])

  // Fetch places by category using the internal hook
  const { places: categoryPlaces, isLoading: placesLoading, isLoadingMore, hasMore, loadMore, refetch } = usePlaces({
    destination: dayLocation || tripDestination,
    location: locationCoords || { lat: 0, lng: 0 },
    category: selectedCategory,
    enabled: isOpen && !!locationCoords && !searchQuery.trim(),
  })

  // Search hook for real API search
  const { results: searchResults, isSearching, search: searchPlaces, clearResults: clearSearch } = usePlaceSearch({
    destination: dayLocation || tripDestination,
    location: locationCoords || { lat: 0, lng: 0 },
    enabled: isOpen && !!locationCoords,
  })

  // Determine which places to show: search results or category results
  const isSearchMode = searchQuery.trim().length > 0
  const places = isSearchMode ? searchResults : categoryPlaces

  // Combined loading state
  const isLoading = coordsLoading || (isSearchMode ? isSearching : placesLoading)

  // Infinite scroll: ref for the sentinel element
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Set up IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, loadMore])

  // Map center (from places or coordinates)
  const mapCenter: Coordinates = useMemo(() => {
    if (places.length > 0) {
      return places[0].location
    }
    if (locationCoords) {
      return locationCoords
    }
    // Default fallback
    return { lat: 10.4679, lng: -84.6432 }
  }, [places, locationCoords])

  // Filter and sort places (local filters only - search is via API)
  const filteredPlaces = useMemo(() => {
    let result = [...places]

    // Get active chip (if any)
    const activeChip = DISCOVERY_CHIPS.find(c => c.id === selectedChipId)

    // Apply chip's local filter (independent from category)
    if (activeChip?.localFilter) {
      result = result.filter(activeChip.localFilter)
    }

    // Filter by minimum rating
    if (minRating) {
      result = filterByMinRating(result, minRating)
    }

    // Filter by open now
    if (openNowFilter) {
      result = result.filter((p) => p.openNow === true)
    }

    // Sort based on chip's sortBy preference
    if (activeChip?.sortBy === "hidden-gem") {
      result = sortByHiddenGemScore(result)
    } else {
      result = sortByOverallQuality(result)
    }

    return result
  }, [places, minRating, openNowFilter, selectedChipId])

  // Handle search input change - triggers debounced API search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    if (value.trim()) {
      searchPlaces(value)
    } else {
      clearSearch()
    }
  }, [searchPlaces, clearSearch])

  // Handle search submit (immediate search on Enter)
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      searchPlaces(searchQuery)
    }
  }, [searchQuery, searchPlaces])

  // Handle category change - triggers refetch via usePlaces dependency
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category as PlaceCategory)
  }

  // Handle chip selection - NEVER touches category (chips and tabs are INDEPENDENT)
  // Toggle logic is handled by DiscoveryChips component
  const handleChipSelect = (chip: DiscoveryChip | null) => {
    setSelectedChipId(chip?.id || null)
    // NEVER touch selectedCategory - they are independent controls
  }

  // Handle place selection
  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place)
    setShowDetailPanel(true)
  }

  // Handle place hover - for map highlighting
  const handlePlaceHover = (place: Place | null) => {
    setHoveredPlace(place)
  }

  // Handle add place
  const handleAddPlace = (place: Place) => {
    onAddPlace(place, selectedDay)
    // Optionally close detail panel
    setShowDetailPanel(false)
    setSelectedPlace(null)
  }

  // Handle day change
  const handleDayChange = (day: number) => {
    setSelectedDay(day)
  }

  // Close detail panel
  const closeDetailPanel = () => {
    setShowDetailPanel(false)
    setSelectedPlace(null)
  }

  // Categories for tabs (no "Todos" - use search for that)
  const categories = [
    { id: "attractions", label: "Atracciones", emoji: "🎯" },
    { id: "restaurants", label: "Restaurantes", emoji: "🍽️" },
    { id: "cafes", label: "Cafés", emoji: "☕" },
    { id: "nature", label: "Naturaleza", emoji: "🌋" },
    { id: "bars", label: "Bares", emoji: "🍺" },
    { id: "museums", label: "Museos", emoji: "🏛️" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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
        {/* Header - stacks on mobile */}
        <div className="flex flex-col gap-2 px-3 py-3 border-b border-border bg-background md:flex-row md:items-center md:justify-between md:px-6 md:py-4">
          {/* Mobile: Title first (centered) */}
          <DialogTitle className="text-base font-semibold text-center md:hidden">
            {mode === 'replace' && activityName ? (
              <span>
                Buscar: <span className="text-primary truncate">{activityName}</span>
              </span>
            ) : (
              <span className="truncate">Explorar en {dayLocation || tripDestination}</span>
            )}
          </DialogTitle>

          {/* Mobile: Row with close button and day selector */}
          <div className="flex items-center justify-between md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Cerrar</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  Día {selectedDay}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableDays.length > 0 ? (
                  availableDays.map((day) => (
                    <DropdownMenuItem
                      key={day.number}
                      onClick={() => handleDayChange(day.number)}
                      className={selectedDay === day.number ? "bg-muted" : ""}
                    >
                      Día {day.number} - {day.location}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem onClick={() => handleDayChange(dayNumber)}>
                    Día {dayNumber} - {dayLocation}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop: Original 3-column layout */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="gap-2 hidden md:inline-flex"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </Button>

          <DialogTitle className="text-lg font-semibold hidden md:block">
            {mode === 'replace' && activityName ? (
              <span>
                Buscar para: <span className="text-primary">{activityName}</span>
              </span>
            ) : (
              <>Explorar en {dayLocation || tripDestination}</>
            )}
          </DialogTitle>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 hidden md:inline-flex">
                Día {selectedDay}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {availableDays.length > 0 ? (
                availableDays.map((day) => (
                  <DropdownMenuItem
                    key={day.number}
                    onClick={() => handleDayChange(day.number)}
                    className={selectedDay === day.number ? "bg-muted" : ""}
                  >
                    Día {day.number} - {day.location}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem onClick={() => handleDayChange(dayNumber)}>
                  Día {dayNumber} - {dayLocation}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search bar and filters */}
        <div className="px-3 py-3 border-b border-border bg-background space-y-3 sm:px-4 sm:space-y-4 md:px-6 md:py-4">
          {/* Search input - stacks on mobile */}
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder='Buscar lugares...'
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 h-11 text-sm sm:h-12 sm:text-base"
              />
            </div>
            <Button onClick={handleSearch} className="h-11 w-full sm:w-auto sm:h-12 sm:px-6">
              Buscar
            </Button>
          </div>

          {/* Filters - horizontal scroll on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide md:overflow-visible md:flex-wrap md:pb-0">
            {/* Rating filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`gap-2 shrink-0 ${minRating ? "border-primary text-primary" : ""}`}
                >
                  <Star className="w-4 h-4" />
                  {minRating ? `${minRating}+` : "Rating"}
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setMinRating(null)}>
                  Cualquiera
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMinRating(4)}>
                  4+ estrellas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMinRating(4.5)}>
                  4.5+ estrellas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Open now filter */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenNowFilter(!openNowFilter)}
              className={`gap-2 shrink-0 whitespace-nowrap ${openNowFilter ? "border-primary text-primary bg-primary/5" : ""}`}
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Abierto ahora</span>
              <span className="sm:hidden">Abierto</span>
            </Button>

            {/* Clear filters */}
            {(minRating || openNowFilter || selectedChipId || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMinRating(null)
                  setOpenNowFilter(false)
                  setSelectedChipId(null)
                  setSearchQuery("")
                  clearSearch()
                }}
                className="text-muted-foreground"
              >
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Discovery chips */}
          <DiscoveryChips
            selectedChipId={selectedChipId}
            onSelectChip={handleChipSelect}
          />

          {/* Category tabs */}
          <Tabs
            value={selectedCategory}
            onValueChange={handleCategoryChange}
            className="w-full"
          >
            <TabsList className="w-full justify-start overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id} className="gap-1 shrink-0 px-2.5 sm:gap-1.5 sm:px-3">
                  {cat.emoji && <span className="text-sm">{cat.emoji}</span>}
                  <span className="text-xs sm:text-sm whitespace-nowrap">{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Main content: Split view with mobile toggle */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left: Places grid - full width on mobile, 60% on desktop */}
          <div className={cn(
            "overflow-y-auto bg-muted/30",
            "p-3 sm:p-4 md:p-6",
            "w-full md:w-[60%]",
            // Hide when in map mode on mobile
            mobileViewMode === 'map' && "hidden md:block"
          )}>
            {/* Results count and active filter indicator */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  {isLoading
                    ? isSearchMode
                      ? `Buscando "${searchQuery}"...`
                      : "Cargando lugares..."
                    : isSearchMode
                      ? `${filteredPlaces.length} resultados para "${searchQuery}"`
                      : `${filteredPlaces.length} lugares encontrados`}
                </p>
                {/* Active chip indicator */}
                {selectedChipId && !isLoading && (() => {
                  const activeChip = DISCOVERY_CHIPS.find(c => c.id === selectedChipId)
                  if (!activeChip) return null
                  return (
                    <div className="flex items-center gap-1.5 text-sm text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      <span>{activeChip.emoji}</span>
                      <span>{activeChip.label}</span>
                      <button
                        onClick={() => setSelectedChipId(null)}
                        className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                        title="Quitar filtro"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Places grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <PlaceCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredPlaces.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredPlaces.map((place, index) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      onAdd={handleAddPlace}
                      onSelect={handlePlaceSelect}
                      onHover={handlePlaceHover}
                      isSelected={selectedPlace?.id === place.id}
                      isHovered={hoveredPlace?.id === place.id}
                      dayNumber={selectedDay}
                      mode={mode}
                    />
                  ))}
                </div>

                {/* Infinite scroll sentinel and loading indicator - only for category mode */}
                {!isSearchMode && (
                  <div ref={loadMoreRef} className="py-8 flex justify-center">
                    {isLoadingMore ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Cargando más lugares...</span>
                      </div>
                    ) : hasMore ? (
                      <span className="text-sm text-muted-foreground">
                        Desplázate para cargar más
                      </span>
                    ) : categoryPlaces.length > 20 ? (
                      <span className="text-sm text-muted-foreground">
                        No hay más lugares para mostrar
                      </span>
                    ) : null}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  No encontramos lugares
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {isSearchMode ? (
                    <>
                      No encontramos resultados para{" "}
                      <span className="font-medium">&quot;{searchQuery}&quot;</span>
                      {" "}en {dayLocation || tripDestination}.
                    </>
                  ) : selectedChipId ? (
                    <>
                      No encontramos{" "}
                      <span className="font-medium">
                        {DISCOVERY_CHIPS.find(c => c.id === selectedChipId)?.label.toLowerCase()}
                      </span>
                      {" "}en{" "}
                      <span className="font-medium">
                        {categories.find(c => c.id === selectedCategory)?.label.toLowerCase()}
                      </span>
                      {" "}para esta ubicación.
                    </>
                  ) : (
                    "Intenta con otros términos de búsqueda o cambia los filtros."
                  )}
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {isSearchMode && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("")
                        clearSearch()
                      }}
                    >
                      Limpiar búsqueda
                    </Button>
                  )}
                  {selectedChipId && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedChipId(null)}
                    >
                      Quitar &quot;{DISCOVERY_CHIPS.find(c => c.id === selectedChipId)?.label}&quot;
                    </Button>
                  )}
                  {(minRating || openNowFilter) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMinRating(null)
                        setOpenNowFilter(false)
                      }}
                    >
                      Limpiar filtros
                    </Button>
                  )}
                  {onCreateCustomActivity && (
                    <Button
                      variant="default"
                      onClick={() => {
                        onCreateCustomActivity(selectedDay)
                        onClose()
                      }}
                    >
                      Crear actividad manual
                    </Button>
                  )}
                </div>
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
            {showDetailPanel && selectedPlace ? (
              <div className="absolute inset-0 bg-background overflow-y-auto">
                <PlaceDetailPanel
                  place={selectedPlace}
                  isOpen={true}
                  onClose={closeDetailPanel}
                  onAddToTrip={handleAddPlace}
                  inline={true}
                  mode={mode}
                />
              </div>
            ) : (
              <ExploreMap
                places={filteredPlaces}
                center={mapCenter}
                selectedPlaceId={selectedPlace?.id}
                hoveredPlaceId={hoveredPlace?.id}
                dayAccommodation={dayAccommodation}
                onPlaceSelect={handlePlaceSelect}
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

        {/* Footer - subtle link for custom activity */}
        {onCreateCustomActivity && (
          <div className="px-6 py-3 border-t border-border bg-muted/30 text-center">
            <button
              onClick={() => {
                onCreateCustomActivity(selectedDay)
                onClose()
              }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ¿No encuentras lo que buscas?{' '}
              <span className="underline underline-offset-2">Crear actividad manual</span>
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
