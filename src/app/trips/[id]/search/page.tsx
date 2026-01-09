"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  X,
  Search,
  Star,
  Clock,
  Loader2,
  Map,
  List,
  Compass,
  ChevronDown,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react"
import { DiscoveryChips } from "@/components/explore/DiscoveryChips"
import { PlaceCard, PlaceCardSkeleton } from "@/components/explore/PlaceCard"
import { ExploreMap } from "@/components/explore/ExploreMap"
import { PlaceDetailModal } from "@/components/explore/PlaceDetailModal"
import { usePlaces, usePlaceSearch } from "@/lib/explore/hooks"
import { useTrip } from "@/hooks/useTrips"
import { usePlan, useSavePlan } from "@/hooks/usePlan"
import { useAuth } from "@/contexts/AuthContext"
import { addPlaceToItinerary } from "@/lib/plan/addPlaceToItinerary"
import {
  sortByHiddenGemScore,
  sortByOverallQuality,
  filterByMinRating,
} from "@/lib/places/scoring"
import type {
  Place,
  PlaceCategory,
  Coordinates,
  DiscoveryChip,
} from "@/types/explore"
import { DISCOVERY_CHIPS } from "@/types/explore"
import type { GeneratedPlan } from "@/types/plan"

// Geocode a location name to coordinates
async function geocodeLocation(locationName: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(`/api/explore/destinations?q=${encodeURIComponent(locationName)}`)
    if (!response.ok) return null

    const data = await response.json()
    if (!data.suggestions?.[0]?.placeId) return null

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

// Categories with icons
const CATEGORIES: { id: PlaceCategory; label: string; icon: string }[] = [
  { id: "attractions", label: "Atracciones", icon: "🎯" },
  { id: "restaurants", label: "Restaurantes", icon: "🍽️" },
  { id: "cafes", label: "Cafes", icon: "☕" },
  { id: "nature", label: "Naturaleza", icon: "🌋" },
  { id: "bars", label: "Bares", icon: "🍺" },
  { id: "museums", label: "Museos", icon: "🏛️" },
]

export default function SearchPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tripId = params.id as string

  // Parse URL params
  const dayNumber = parseInt(searchParams.get("day") || "1", 10)
  const location = searchParams.get("location") || ""
  const mode = (searchParams.get("mode") || "add") as "add" | "replace"
  const activityId = searchParams.get("activityId") || undefined
  const initialCategory = (searchParams.get("category") || "attractions") as PlaceCategory

  // Auth and data hooks
  useAuth()
  const { trip, loading: tripLoading } = useTrip(tripId)
  const { planData, loading: planLoading } = usePlan(tripId)
  const { savePlan } = useSavePlan()

  // Local state
  const [selectedDay, setSelectedDay] = useState(dayNumber)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory>(initialCategory)
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [hoveredPlace, setHoveredPlace] = useState<Place | null>(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [minRating, setMinRating] = useState<number | null>(null)
  const [openNowFilter, setOpenNowFilter] = useState(false)
  const [mobileViewMode, setMobileViewMode] = useState<"list" | "map">("list")
  const [isAddingPlace, setIsAddingPlace] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Geocoding state
  const [locationCoords, setLocationCoords] = useState<Coordinates | null>(null)
  const [coordsLoading, setCoordsLoading] = useState(true)

  // Get available days from plan
  const availableDays = useMemo(() => {
    if (!planData) return []
    const plan = planData as unknown as GeneratedPlan
    return plan.itinerary.map(day => ({
      number: day.day,
      location: day.timeline[0]?.location || plan.trip.destination,
    }))
  }, [planData])

  // Geocode location on mount
  useEffect(() => {
    async function fetchCoords() {
      setCoordsLoading(true)
      let coords = await geocodeLocation(location)

      if (!coords && trip?.destination && trip.destination !== location) {
        coords = await geocodeLocation(trip.destination)
      }

      setLocationCoords(coords)
      setCoordsLoading(false)
    }

    if (location || trip?.destination) {
      fetchCoords()
    }
  }, [location, trip?.destination])

  // Fetch places by category
  const {
    places: categoryPlaces,
    isLoading: placesLoading,
    isLoadingMore,
    hasMore,
    loadMore,
  } = usePlaces({
    destination: location || trip?.destination || "",
    location: locationCoords || { lat: 0, lng: 0 },
    category: selectedCategory,
    enabled: !!locationCoords && !searchQuery.trim(),
  })

  // Search hook
  const {
    results: searchResults,
    isSearching,
    search: searchPlaces,
    clearResults: clearSearch,
  } = usePlaceSearch({
    destination: location || trip?.destination || "",
    location: locationCoords || { lat: 0, lng: 0 },
    enabled: !!locationCoords,
  })

  // Determine which places to show
  const isSearchMode = searchQuery.trim().length > 0
  const places = isSearchMode ? searchResults : categoryPlaces
  const isLoading = coordsLoading || (isSearchMode ? isSearching : placesLoading)

  // Infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null)

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

  // Map center
  const mapCenter: Coordinates = useMemo(() => {
    if (places.length > 0) return places[0].location
    if (locationCoords) return locationCoords
    return { lat: 10.4679, lng: -84.6432 }
  }, [places, locationCoords])

  // Filter and sort places
  const filteredPlaces = useMemo(() => {
    let result = [...places]

    const activeChip = DISCOVERY_CHIPS.find(c => c.id === selectedChipId)

    if (activeChip?.localFilter) {
      result = result.filter(activeChip.localFilter)
    }

    if (minRating) {
      result = filterByMinRating(result, minRating)
    }

    if (openNowFilter) {
      result = result.filter((p) => p.openNow === true)
    }

    if (activeChip?.sortBy === "hidden-gem") {
      result = sortByHiddenGemScore(result)
    } else {
      result = sortByOverallQuality(result)
    }

    return result
  }, [places, minRating, openNowFilter, selectedChipId])

  // Active filters count
  const activeFiltersCount = [minRating, openNowFilter, selectedChipId].filter(Boolean).length

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    if (value.trim()) {
      searchPlaces(value)
    } else {
      clearSearch()
    }
  }, [searchPlaces, clearSearch])

  const handleCategoryChange = (category: PlaceCategory) => {
    setSelectedCategory(category)
  }

  const handleChipSelect = (chip: DiscoveryChip | null) => {
    setSelectedChipId(chip?.id || null)
  }

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place)
    setShowDetailPanel(true)
  }

  const handlePlaceHover = (place: Place | null) => {
    setHoveredPlace(place)
  }

  const handleAddPlace = async (place: Place) => {
    if (!planData || isAddingPlace) return

    setIsAddingPlace(true)

    try {
      const plan = planData as unknown as GeneratedPlan
      const updatedPlan = await addPlaceToItinerary(
        plan,
        place,
        selectedDay,
        location || trip?.destination || "",
        mode,
        activityId
      )

      await savePlan(tripId, updatedPlan as unknown as Record<string, unknown>)
      router.push(`/trips/${tripId}/planning`)
    } catch (error) {
      console.error("Error adding place:", error)
      setIsAddingPlace(false)
    }
  }

  const handleDayChange = (newDay: number) => {
    setSelectedDay(newDay)
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set("day", String(newDay))
    router.replace(`/trips/${tripId}/search?${newParams}`, { scroll: false })
  }

  const closeDetailPanel = () => {
    setShowDetailPanel(false)
    setSelectedPlace(null)
  }

  const clearAllFilters = () => {
    setMinRating(null)
    setOpenNowFilter(false)
    setSelectedChipId(null)
    setSearchQuery("")
    clearSearch()
  }

  // Loading state
  if (tripLoading || planLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 border-b border-border px-4 flex items-center">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="p-6">
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-10 w-28 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <PlaceCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Trip not found
  if (!trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <Compass className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Viaje no encontrado</h1>
          <p className="text-muted-foreground">El viaje que buscas no existe.</p>
        </div>
        <Button onClick={() => router.push("/")}>Volver al inicio</Button>
      </div>
    )
  }

  const destinationName = location || trip.destination

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Compact Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/trips/${tripId}/planning`)}
              className="shrink-0 -ml-2"
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Search Input */}
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={`Buscar en ${destinationName}...`}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 pr-4 h-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Day Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                  Dia {selectedDay}
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableDays.map((day) => (
                  <DropdownMenuItem
                    key={day.number}
                    onClick={() => handleDayChange(day.number)}
                    className={selectedDay === day.number ? "bg-muted" : ""}
                  >
                    Dia {day.number}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Category Pills - Horizontally scrollable */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                selectedCategory === cat.id
                  ? "bg-foreground text-background"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ml-auto",
              activeFiltersCount > 0
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-xs">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Expandable Filters Panel */}
        {showFilters && (
          <div className="px-4 pb-4 border-t border-border pt-3 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Quick Filters Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("gap-1.5", minRating && "border-primary text-primary")}
                  >
                    <Star className="w-3.5 h-3.5" />
                    {minRating ? `${minRating}+` : "Rating"}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setMinRating(null)}>
                    Cualquiera
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setMinRating(4)}>
                    <Star className="w-3.5 h-3.5 mr-2 fill-amber-400 text-amber-400" />
                    4+ estrellas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMinRating(4.5)}>
                    <Star className="w-3.5 h-3.5 mr-2 fill-amber-400 text-amber-400" />
                    4.5+ estrellas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenNowFilter(!openNowFilter)}
                className={cn("gap-1.5", openNowFilter && "border-primary text-primary bg-primary/5")}
              >
                <Clock className="w-3.5 h-3.5" />
                Abierto ahora
              </Button>

              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground ml-auto"
                >
                  Limpiar todo
                </Button>
              )}
            </div>

            {/* Discovery Chips */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Descubre
              </p>
              <DiscoveryChips
                selectedChipId={selectedChipId}
                onSelectChip={handleChipSelect}
                compact
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Places Grid */}
        <div
          className={cn(
            "flex-1 overflow-y-auto",
            "p-4 md:p-6",
            mobileViewMode === "map" && "hidden md:block"
          )}
        >
          {/* Results Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {isLoading ? (
                  "Cargando..."
                ) : (
                  <>
                    <span className="font-medium text-foreground">{filteredPlaces.length}</span>
                    {" "}lugares
                    {isSearchMode && (
                      <span> para &quot;{searchQuery}&quot;</span>
                    )}
                  </>
                )}
              </span>

              {/* Active chip badge */}
              {selectedChipId && !isLoading && (() => {
                const activeChip = DISCOVERY_CHIPS.find(c => c.id === selectedChipId)
                if (!activeChip) return null
                return (
                  <button
                    onClick={() => setSelectedChipId(null)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <span>{activeChip.emoji}</span>
                    <span>{activeChip.label}</span>
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                )
              })()}
            </div>
          </div>

          {/* Places Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <PlaceCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredPlaces.length > 0 ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPlaces.map((place) => (
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

              {/* Infinite scroll sentinel */}
              {!isSearchMode && (
                <div ref={loadMoreRef} className="py-8 flex justify-center">
                  {isLoadingMore ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Cargando mas...</span>
                    </div>
                  ) : hasMore ? (
                    <span className="text-sm text-muted-foreground">
                      Scroll para ver mas
                    </span>
                  ) : categoryPlaces.length > 20 ? (
                    <span className="text-sm text-muted-foreground">
                      Fin de resultados
                    </span>
                  ) : null}
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Sin resultados</h3>
              <p className="text-sm text-muted-foreground max-w-xs mb-4">
                {isSearchMode ? (
                  <>No encontramos &quot;{searchQuery}&quot; en {destinationName}</>
                ) : (
                  "Intenta con otra categoria o ajusta los filtros"
                )}
              </p>
              {(isSearchMode || activeFiltersCount > 0) && (
                <Button variant="outline" onClick={clearAllFilters}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Map Panel */}
        <div
          className={cn(
            "w-full md:w-[45%] lg:w-[40%] border-l border-border",
            "absolute inset-0 md:relative",
            mobileViewMode === "list" && "hidden md:block"
          )}
        >
          <ExploreMap
            places={filteredPlaces}
            center={mapCenter}
            selectedPlaceId={selectedPlace?.id}
            hoveredPlaceId={hoveredPlace?.id}
            onPlaceSelect={handlePlaceSelect}
          />
        </div>

        {/* Mobile View Toggle FAB */}
        <Button
          onClick={() => setMobileViewMode(v => v === "list" ? "map" : "list")}
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg md:hidden z-30"
          size="icon"
        >
          {mobileViewMode === "list" ? (
            <Map className="w-5 h-5" />
          ) : (
            <List className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Place Detail Modal */}
      <PlaceDetailModal
        place={selectedPlace}
        isOpen={showDetailPanel && selectedPlace !== null}
        onClose={closeDetailPanel}
        onAdd={handleAddPlace}
        onViewOnMap={(place) => {
          closeDetailPanel()
          setHoveredPlace(place)
          if (window.innerWidth < 768) {
            setMobileViewMode("map")
          }
        }}
        mode={mode}
      />

      {/* Loading overlay when adding */}
      {isAddingPlace && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex items-center gap-3 bg-card rounded-xl px-6 py-4 shadow-lg border border-border">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="font-medium">Agregando...</span>
          </div>
        </div>
      )}
    </div>
  )
}
