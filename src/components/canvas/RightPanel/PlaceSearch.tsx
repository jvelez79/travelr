"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { MapPin, GripVertical } from "lucide-react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"
import { ImageCarousel } from "@/components/ui/ImageCarousel"
import { useCanvasContext } from "../CanvasContext"
import { usePlaces, useDestinationSearch } from "@/lib/explore/hooks"
import { DaySelectorDropdown } from "@/components/ai/DaySelectorDropdown"
import { useAddToThingsToDo } from "@/hooks/useThingsToDo"
import type { GeneratedPlan, TimelineEntry, PlaceData, ItineraryDay } from "@/types/plan"
import type { Place, PlaceCategory, Coordinates } from "@/types/explore"
import { recalculateTimeline } from "@/lib/timeUtils"
import { calculateTransportForTimeline } from "@/lib/transportUtils"

interface PlaceSearchProps {
  tripId: string
  dayNumber?: number | null
  timeSlot?: string
  replaceActivityId?: string
  preselectedCategory?: PlaceCategory
  plan: GeneratedPlan
  onUpdatePlan?: (plan: GeneratedPlan) => void
  onOpenCustomActivity?: () => void
}

// Common destination coordinates for fallback
const DESTINATION_COORDS: Record<string, Coordinates> = {
  "costa rica": { lat: 9.9281, lng: -84.0907 },
  "san jose": { lat: 9.9281, lng: -84.0907 },
  "la fortuna": { lat: 10.4678, lng: -84.6427 },
  "manuel antonio": { lat: 9.3927, lng: -84.1367 },
  "puerto viejo": { lat: 9.6558, lng: -82.7539 },
  "monteverde": { lat: 10.3100, lng: -84.8250 },
  "paraiso": { lat: 9.8389, lng: -83.8619 },
  "alajuela": { lat: 10.0162, lng: -84.2116 },
  "quepos": { lat: 9.4312, lng: -84.1617 },
  "herradura": { lat: 9.6556, lng: -84.6489 },
  "jaco": { lat: 9.6154, lng: -84.6267 },
  "arenal": { lat: 10.4626, lng: -84.7033 },
  "liberia": { lat: 10.6346, lng: -85.4407 },
  "guanacaste": { lat: 10.4283, lng: -85.4514 },
  "tamarindo": { lat: 10.2992, lng: -85.8372 },
}

// Nearby places for dropdown
interface NearbyPlace {
  id: string
  name: string
  fullName: string
  coords: Coordinates
}

const NEARBY_DESTINATIONS: NearbyPlace[] = [
  { id: "la-fortuna", name: "La Fortuna", fullName: "Province of Alajuela, Costa Rica", coords: { lat: 10.4678, lng: -84.6427 } },
  { id: "arenal", name: "Arenal", fullName: "Province of Alajuela, Costa Rica", coords: { lat: 10.4626, lng: -84.7033 } },
  { id: "monteverde", name: "Monteverde", fullName: "Province of Puntarenas, Costa Rica", coords: { lat: 10.3100, lng: -84.8250 } },
  { id: "san-jose", name: "San Jose", fullName: "Province of San Jose, Costa Rica", coords: { lat: 9.9281, lng: -84.0907 } },
  { id: "alajuela", name: "Alajuela", fullName: "Province of Alajuela, Costa Rica", coords: { lat: 10.0162, lng: -84.2116 } },
  { id: "manuel-antonio", name: "Manuel Antonio", fullName: "Province of Puntarenas, Costa Rica", coords: { lat: 9.3927, lng: -84.1367 } },
  { id: "jaco", name: "Jaco", fullName: "Province of Puntarenas, Costa Rica", coords: { lat: 9.6154, lng: -84.6267 } },
  { id: "tamarindo", name: "Tamarindo", fullName: "Province of Guanacaste, Costa Rica", coords: { lat: 10.2992, lng: -85.8372 } },
  { id: "puerto-viejo", name: "Puerto Viejo", fullName: "Province of Limon, Costa Rica", coords: { lat: 9.6558, lng: -82.7539 } },
]

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  restaurants: "Restaurantes",
  attractions: "Atracciones",
  cafes: "Cafes",
  bars: "Bares",
  museums: "Museos",
  nature: "Naturaleza",
  landmarks: "Puntos de Interés",
  beaches: "Playas",
  religious: "Sitios Religiosos",
  markets: "Mercados",
  viewpoints: "Miradores",
  wellness: "Bienestar",
}

const AVAILABLE_CATEGORIES: PlaceCategory[] = ["attractions", "restaurants", "cafes", "bars", "nature"]

// Get coordinates for a destination
function getDestinationCoords(destination: string): Coordinates {
  const normalized = destination.toLowerCase().trim()

  if (DESTINATION_COORDS[normalized]) {
    return DESTINATION_COORDS[normalized]
  }

  for (const [key, coords] of Object.entries(DESTINATION_COORDS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords
    }
  }

  return { lat: 9.9281, lng: -84.0907 } // Default Costa Rica
}

// Detect day location from itinerary
function getDayLocation(day: ItineraryDay | undefined, plan: GeneratedPlan): string {
  if (!day) return plan.trip.destination

  // 1. First activity location
  if (day.timeline[0]?.location) {
    return day.timeline[0].location
  }

  // 2. Extract from day title (e.g., "Dia 3 - La Fortuna")
  if (day.title) {
    const titleMatch = day.title.match(/[-–]\s*(.+)$/)
    if (titleMatch) {
      return titleMatch[1].trim()
    }
  }

  // 3. Fallback to trip destination
  return plan.trip.destination
}

// Calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function formatDistance(miles: number): string {
  if (miles < 0.1) return "0 mi"
  if (miles < 1) return `${Math.round(miles * 10) / 10} mi`
  return `${Math.round(miles)} mi`
}

// Convert Place to PlaceData
function placeToPlaceData(place: Place): PlaceData {
  return {
    name: place.name,
    category: place.category,
    rating: place.rating,
    reviewCount: place.reviewCount,
    priceLevel: place.priceLevel,
    coordinates: {
      lat: place.location.lat,
      lng: place.location.lng,
    },
    address: place.location.address,
    images: place.images?.slice(0, 10),
    googleMapsUrl: place.googleMapsUrl || `https://www.google.com/maps/place/?q=place_id:${place.id}`,
    phone: place.phone,
    website: place.website,
    openingHours: place.openingHours,
  }
}

// Get icon for category
function getIconForCategory(category: PlaceCategory): string {
  const icons: Record<PlaceCategory, string> = {
    attractions: "🎯",
    nature: "🌋",
    restaurants: "🍽️",
    cafes: "☕",
    bars: "🍺",
    museums: "🎭",
    landmarks: "🗿",
    beaches: "🏖️",
    religious: "⛪",
    markets: "🛒",
    viewpoints: "🏔️",
    wellness: "🧘",
  }
  return icons[category] || "🎯"
}

// Draggable place item component
interface DraggablePlaceItemProps {
  place: Place
  index: number
  days: ItineraryDay[]
  onAddToDay: (dayNumber: number) => Promise<void>
  onAddToThingsToDo: () => Promise<void>
}

function DraggablePlaceItem({ place, index, days, onAddToDay, onAddToThingsToDo }: DraggablePlaceItemProps) {
  const [showCarousel, setShowCarousel] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `place-${place.id}`,
    data: {
      type: "place" as const,
      place,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  const handleSelectDay = async (dayNumber: number) => {
    setIsLoading(true)
    try {
      await onAddToDay(dayNumber)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToThingsToDo = async () => {
    setIsLoading(true)
    try {
      await onAddToThingsToDo()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`
          flex gap-3 p-3 rounded-lg border bg-background transition-all cursor-grab group
          ${isDragging
            ? "border-primary shadow-lg z-50"
            : "border-border hover:border-primary/50"
          }
        `}
        {...attributes}
        {...listeners}
      >
        {/* Drag Handle + Number */}
        <div className="flex-shrink-0 flex items-center gap-1">
          <GripVertical className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground" />
          <div className="w-5 h-5 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center text-xs font-bold text-muted-foreground group-hover:text-primary">
            {index + 1}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground leading-tight truncate">
            {place.name}
          </h4>

          {/* Rating & Price */}
          <div className="flex items-center gap-1 mt-0.5">
            {place.rating && (
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs font-medium">{place.rating.toFixed(1)}</span>
                {place.reviewCount && (
                  <span className="text-xs text-muted-foreground">({place.reviewCount.toLocaleString()})</span>
                )}
              </div>
            )}
            {place.priceLevel && (
              <span className="text-xs text-muted-foreground ml-1">
                {"$".repeat(place.priceLevel)}
              </span>
            )}
          </div>

          {/* Description */}
          {place.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {place.description}
            </p>
          )}

          {/* Drag hint */}
          <p className="text-xs text-primary/70 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Arrastra al dia deseado o haz clic en +
          </p>
        </div>

        {/* Image - Clickable for carousel */}
        {place.images?.[0] && (
          <button
            className="flex-shrink-0 w-14 h-14 relative rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              if (place.images && place.images.length > 0) {
                setShowCarousel(true)
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Ver fotos"
          >
            <Image
              src={place.images[0]}
              alt={place.name}
              fill
              sizes="56px"
              className="object-cover"
              unoptimized={place.images[0].includes("googleapis.com")}
            />
          </button>
        )}

        {/* Add Button with Dropdown */}
        <div className="flex-shrink-0 flex items-center" onPointerDown={(e) => e.stopPropagation()}>
          <DaySelectorDropdown
            days={days}
            onSelectDay={handleSelectDay}
            onAddToThingsToDo={handleAddToThingsToDo}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Image Carousel Modal */}
      {showCarousel && place.images && place.images.length > 0 && (
        <ImageCarousel
          images={place.images}
          title={place.name}
          onClose={() => setShowCarousel(false)}
        />
      )}
    </>
  )
}

export function PlaceSearch({ tripId, dayNumber, timeSlot, replaceActivityId, preselectedCategory, plan, onUpdatePlan, onOpenCustomActivity }: PlaceSearchProps) {
  const { clearRightPanel } = useCanvasContext()
  const { addItem: addToThingsToDo } = useAddToThingsToDo()
  const day = dayNumber ? plan.itinerary.find(d => d.day === dayNumber) : undefined

  // Modo reemplazo: buscar la actividad original para preservar hora/duración
  const activityToReplace = replaceActivityId
    ? day?.timeline.find(a => a.id === replaceActivityId)
    : undefined

  // Location state
  const initialLocation = getDayLocation(day, plan)
  const [currentLocation, setCurrentLocation] = useState(initialLocation)
  const [locationInputValue, setLocationInputValue] = useState(initialLocation)
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const locationDropdownRef = useRef<HTMLDivElement>(null)

  // Category state - usar categoría preseleccionada si está en modo reemplazo
  const [activeCategory, setActiveCategory] = useState<PlaceCategory>(preselectedCategory || "attractions")

  // Search suggestions
  const { suggestions: searchSuggestions, isLoading: searchLoading, search: performSearch } = useDestinationSearch()

  // Get coordinates for current location
  const locationCoords = getDestinationCoords(currentLocation)

  // Nearby places with distances
  const nearbyPlaces = NEARBY_DESTINATIONS
    .map(place => ({
      ...place,
      distance: calculateDistance(
        locationCoords.lat,
        locationCoords.lng,
        place.coords.lat,
        place.coords.lng
      )
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 8)

  // Fetch places using the hook
  const { places, isLoading } = usePlaces({
    destination: currentLocation,
    location: locationCoords,
    category: activeCategory,
    enabled: true,
  })

  // Handle location input change
  const handleLocationInputChange = useCallback((value: string) => {
    setLocationInputValue(value)
    if (value.length >= 2) {
      performSearch(value)
    }
  }, [performSearch])

  // Handle selecting a nearby place
  const handleSelectNearbyPlace = useCallback((place: typeof nearbyPlaces[0]) => {
    setCurrentLocation(place.name)
    setLocationInputValue(place.name)
    setLocationDropdownOpen(false)
  }, [])

  // Handle selecting a search suggestion
  const handleSelectSuggestion = useCallback((suggestion: { mainText: string }) => {
    setCurrentLocation(suggestion.mainText)
    setLocationInputValue(suggestion.mainText)
    setLocationDropdownOpen(false)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target as Node)
      ) {
        setLocationDropdownOpen(false)
        setLocationInputValue(currentLocation)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [currentLocation])

  // Handle escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLocationDropdownOpen(false)
        setLocationInputValue(currentLocation)
        locationInputRef.current?.blur()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [currentLocation])

  const showSearchResults = locationInputValue.length >= 2 &&
    locationInputValue !== currentLocation &&
    searchSuggestions.length > 0

  // Add place to itinerary (o reemplazar si estamos en modo reemplazo)
  const handleAddToDay = useCallback(async (place: Place, targetDayNumber: number) => {
    if (!onUpdatePlan || !targetDayNumber) return

    const newActivity: TimelineEntry = {
      id: `${place.id}-${Date.now()}`,
      // En modo reemplazo, preservar hora y duración de la actividad original
      time: activityToReplace?.time || timeSlot || "Por definir",
      activity: place.name,
      location: place.location.city || currentLocation,
      icon: getIconForCategory(place.category),
      notes: place.description,
      placeId: place.id,
      placeData: placeToPlaceData(place),
      matchConfidence: 'exact',
      durationMinutes: activityToReplace?.durationMinutes || (place.category === 'restaurants' ? 90 : 120),
    }

    let updatedItinerary

    if (replaceActivityId && dayNumber) {
      // Modo reemplazo: sustituir la actividad existente
      updatedItinerary = plan.itinerary.map(d => {
        if (d.day !== dayNumber) return d
        const newTimeline = d.timeline.map(a =>
          a.id === replaceActivityId ? newActivity : a
        )
        return { ...d, timeline: newTimeline }
      })
    } else {
      // Modo normal: agregar nueva actividad al día seleccionado
      updatedItinerary = plan.itinerary.map(d => {
        if (d.day !== targetDayNumber) return d
        const newTimeline = recalculateTimeline([...d.timeline, newActivity])
        return { ...d, timeline: newTimeline }
      })
    }

    // Update plan immediately
    onUpdatePlan({ ...plan, itinerary: updatedItinerary })

    // Calculate transport in background
    const dayToUpdate = updatedItinerary.find(d => d.day === targetDayNumber)
    if (dayToUpdate) {
      try {
        const timelineWithTransport = await calculateTransportForTimeline(dayToUpdate.timeline)
        const finalItinerary = updatedItinerary.map(d =>
          d.day === targetDayNumber ? { ...d, timeline: timelineWithTransport } : d
        )
        onUpdatePlan({ ...plan, itinerary: finalItinerary })
      } catch (error) {
        console.error('Error calculating transport:', error)
      }
    }

    // Toast diferenciado según modo
    if (replaceActivityId) {
      toast.success(`Actividad reemplazada en Día ${dayNumber}`, {
        description: "La actividad anterior fue sustituida"
      })
    } else {
      toast.success(`Actividad añadida al Día ${targetDayNumber}`, {
        description: "Puedes verlo en tu itinerario"
      })
    }
    clearRightPanel()
  }, [timeSlot, currentLocation, plan, onUpdatePlan, clearRightPanel, replaceActivityId, activityToReplace, dayNumber])

  // Handler for adding to Things To Do
  const handleAddToThingsToDo = useCallback(async (place: Place) => {
    try {
      await addToThingsToDo({
        tripId,
        googlePlaceId: place.id,
        placeData: {
          name: place.name,
          formatted_address: place.location.address,
          rating: place.rating,
          user_ratings_total: place.reviewCount,
          types: place.subcategory ? [place.subcategory] : [],
          photos: place.images?.map(url => ({ photo_reference: url })),
          price_level: place.priceLevel,
          editorial_summary: place.description ? { overview: place.description } : undefined,
          geometry: place.location ? {
            location: { lat: place.location.lat, lng: place.location.lng }
          } : undefined,
        },
        category: place.category === 'restaurants' || place.category === 'cafes' || place.category === 'bars'
          ? 'food_drink'
          : 'attractions',
      })

      toast.success(`Actividad guardada en Ideas`, {
        description: "Puedes encontrarlo en la seccion Ideas guardadas"
      })
      clearRightPanel()
    } catch (error) {
      console.error('Error adding to Things To Do:', error)
      toast.error('Error al guardar', {
        description: 'No se pudo agregar el lugar a Ideas guardadas'
      })
    }
  }, [tripId, addToThingsToDo, clearRightPanel])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">
            {replaceActivityId ? 'Seleccionar lugar' : 'Buscar lugares'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {replaceActivityId && activityToReplace
              ? `Reemplazar "${activityToReplace.activity}"`
              : dayNumber && day
              ? `Dia ${dayNumber}: ${day.title}`
              : 'Encuentra lugares para agregar a tu itinerario'
            }
          </p>
        </div>
        <button
          onClick={clearRightPanel}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Location Selector */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={locationInputRef}
            type="text"
            value={locationInputValue}
            onChange={(e) => handleLocationInputChange(e.target.value)}
            onFocus={() => setLocationDropdownOpen(true)}
            placeholder="Buscar ubicacion..."
            className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="animate-spin w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}

          {/* Location Dropdown */}
          {locationDropdownOpen && (
            <div
              ref={locationDropdownRef}
              className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-[300px] overflow-y-auto"
            >
              {/* Search Results */}
              {showSearchResults && (
                <div className="py-1">
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Resultados
                  </div>
                  {searchSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.placeId}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full px-3 py-2 flex items-center gap-2 hover:bg-muted/50 transition-colors text-left"
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{suggestion.mainText}</div>
                        <div className="text-xs text-muted-foreground truncate">{suggestion.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Nearby Places */}
              {!showSearchResults && (
                <div className="py-1">
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Lugares cercanos
                  </div>
                  {nearbyPlaces.map((place) => (
                    <button
                      key={place.id}
                      onClick={() => handleSelectNearbyPlace(place)}
                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{place.name}</div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {formatDistance(place.distance)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-border overflow-x-auto scrollbar-hide">
        {AVAILABLE_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`
              px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-all rounded-full
              ${activeCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
              }
            `}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      {/* Places List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 p-3 border border-border rounded-lg">
                <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
                </div>
                <div className="w-16 h-16 bg-muted rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No encontramos {CATEGORY_LABELS[activeCategory].toLowerCase()} en {currentLocation}
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {places.map((place, index) => (
              <DraggablePlaceItem
                key={place.id}
                place={place}
                index={index}
                days={plan.itinerary}
                onAddToDay={async (targetDayNumber) => await handleAddToDay(place, targetDayNumber)}
                onAddToThingsToDo={async () => await handleAddToThingsToDo(place)}
              />
            ))}

            {/* Results count */}
            <p className="text-xs text-muted-foreground text-center pt-2">
              {places.length} {CATEGORY_LABELS[activeCategory].toLowerCase()}
            </p>
          </div>
        )}
      </div>

      {/* Custom Activity Button - only show when day context exists */}
      {onOpenCustomActivity && (
        <div className="border-t border-border p-3">
          <button
            onClick={onOpenCustomActivity}
            className="w-full py-2.5 px-4 text-sm text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-primary/50 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            Crear actividad personalizada
          </button>
        </div>
      )}
    </div>
  )
}
