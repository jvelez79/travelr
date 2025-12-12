"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MapPin, CalendarPlus, ChevronDown, Search } from "lucide-react"
import { PlaceMap } from "@/components/explore/PlaceMap"
import { PlaceDetailPanel } from "@/components/explore/PlaceDetailPanel"
import { ImageCarousel } from "@/components/ui/ImageCarousel"
import { usePlaces, useDestinationSearch } from "@/lib/explore/hooks"
import { createSavedPlaceFromPlace } from "@/lib/places"
import type { Place, PlaceCategory, Coordinates } from "@/types/explore"
import type { GeneratedPlan, TimelineEntry, PlaceData } from "@/types/plan"

interface ExploreTabProps {
  plan: GeneratedPlan
  onUpdatePlan: (plan: GeneratedPlan) => void
}

// Common destination coordinates for fallback
const DESTINATION_COORDS: Record<string, Coordinates> = {
  "costa rica": { lat: 9.9281, lng: -84.0907 },
  "san jose": { lat: 9.9281, lng: -84.0907 },
  "la fortuna": { lat: 10.4678, lng: -84.6427 },
  "manuel antonio": { lat: 9.3927, lng: -84.1367 },
  "puerto viejo": { lat: 9.6558, lng: -82.7539 },
  "monteverde": { lat: 10.3100, lng: -84.8250 },
  "mexico": { lat: 19.4326, lng: -99.1332 },
  "cancun": { lat: 21.1619, lng: -86.8515 },
  "espana": { lat: 40.4168, lng: -3.7038 },
  "madrid": { lat: 40.4168, lng: -3.7038 },
  "barcelona": { lat: 41.3874, lng: 2.1686 },
  "paris": { lat: 48.8566, lng: 2.3522 },
  "francia": { lat: 48.8566, lng: 2.3522 },
  "italia": { lat: 41.9028, lng: 12.4964 },
  "roma": { lat: 41.9028, lng: 12.4964 },
  "japon": { lat: 35.6762, lng: 139.6503 },
  "tokio": { lat: 35.6762, lng: 139.6503 },
  "peru": { lat: -12.0464, lng: -77.0428 },
  "cusco": { lat: -13.5319, lng: -71.9675 },
  "colombia": { lat: 4.7110, lng: -74.0721 },
  "cartagena": { lat: 10.3910, lng: -75.4794 },
  "puerto rico": { lat: 18.4655, lng: -66.1057 },
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

// Nearby places data structure
interface NearbyPlace {
  id: string
  name: string
  fullName: string
  coords: Coordinates
}

// Nearby destinations grouped by region
const NEARBY_DESTINATIONS: NearbyPlace[] = [
  { id: "la-fortuna", name: "La Fortuna de San Carlos", fullName: "Province of Alajuela, Costa Rica", coords: { lat: 10.4678, lng: -84.6427 } },
  { id: "arenal", name: "Arenal Volcano National Park", fullName: "Province of Alajuela, Costa Rica", coords: { lat: 10.4626, lng: -84.7033 } },
  { id: "monteverde", name: "Monteverde", fullName: "Province of Puntarenas, Costa Rica", coords: { lat: 10.3100, lng: -84.8250 } },
  { id: "san-jose", name: "San Jose", fullName: "Province of San Jose, Costa Rica", coords: { lat: 9.9281, lng: -84.0907 } },
  { id: "alajuela", name: "Alajuela", fullName: "Province of Alajuela, Costa Rica", coords: { lat: 10.0162, lng: -84.2116 } },
  { id: "manuel-antonio", name: "Manuel Antonio", fullName: "Province of Puntarenas, Costa Rica", coords: { lat: 9.3927, lng: -84.1367 } },
  { id: "quepos", name: "Quepos", fullName: "Province of Puntarenas, Costa Rica", coords: { lat: 9.4312, lng: -84.1617 } },
  { id: "jaco", name: "Jaco", fullName: "Province of Puntarenas, Costa Rica", coords: { lat: 9.6154, lng: -84.6267 } },
  { id: "tamarindo", name: "Tamarindo", fullName: "Province of Guanacaste, Costa Rica", coords: { lat: 10.2992, lng: -85.8372 } },
  { id: "liberia", name: "Liberia", fullName: "Province of Guanacaste, Costa Rica", coords: { lat: 10.6346, lng: -85.4407 } },
  { id: "puerto-viejo", name: "Puerto Viejo", fullName: "Province of Limon, Costa Rica", coords: { lat: 9.6558, lng: -82.7539 } },
]

// Calculate distance between two points using Haversine formula
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
  return `${Math.round(miles * 10) / 10} miles`
}

// Mock places data as fallback when API is not available
const MOCK_PLACES: Place[] = [
  {
    id: "la-fortuna-waterfall",
    name: "Catarata La Fortuna",
    category: "attractions",
    subcategory: "Cascada",
    description: "Una impresionante cascada de 70 metros en medio de la selva tropical. El sendero de 500 escalones desciende a través de un exuberante bosque lluvioso hasta una piscina natural donde puedes refrescarte.",
    location: { lat: 10.4421, lng: -84.6621, city: "La Fortuna", country: "Costa Rica", address: "7 km sur de La Fortuna" },
    rating: 4.8,
    reviewCount: 2341,
    images: ["https://images.unsplash.com/photo-1564415315949-7a0c4c73aab4?w=600&q=80"],
    phone: "+506 2479 8360",
    website: "https://cataratalafortuna.com",
    openingHours: ["Lun-Dom: 7:00 AM - 4:00 PM"],
    googleMapsUrl: "https://maps.google.com/?q=Catarata+La+Fortuna+Costa+Rica",
  },
  {
    id: "arenal-volcano",
    name: "Volcan Arenal",
    category: "attractions",
    subcategory: "Volcan",
    description: "Uno de los volcanes mas emblematicos de Costa Rica con su forma conica perfecta. Ofrece senderos panoramicos con vistas espectaculares del lago Arenal y la selva circundante.",
    location: { lat: 10.4626, lng: -84.7033, city: "La Fortuna", country: "Costa Rica", address: "Parque Nacional Volcan Arenal" },
    rating: 4.7,
    reviewCount: 1892,
    images: ["https://images.unsplash.com/photo-1591018533215-ef6e9416e279?w=600&q=80"],
    phone: "+506 2461 8499",
    website: "https://www.sinac.go.cr",
    openingHours: ["Lun-Dom: 8:00 AM - 4:00 PM"],
    googleMapsUrl: "https://maps.google.com/?q=Volcan+Arenal+Costa+Rica",
  },
  {
    id: "tabacon-hot-springs",
    name: "Tabacon Hot Springs",
    category: "nature",
    subcategory: "Aguas Termales",
    description: "Lujoso resort de aguas termales naturales alimentadas por el volcan Arenal. Cuenta con multiples piscinas a diferentes temperaturas, cascadas termales, spa de clase mundial y restaurante gourmet.",
    location: { lat: 10.4731, lng: -84.6789, city: "La Fortuna", country: "Costa Rica", address: "13 km noroeste de La Fortuna" },
    rating: 4.9,
    reviewCount: 3201,
    priceLevel: 4,
    images: ["https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80"],
    phone: "+506 2519 1900",
    website: "https://tabacon.com",
    openingHours: ["Lun-Dom: 10:00 AM - 10:00 PM"],
    googleMapsUrl: "https://maps.google.com/?q=Tabacon+Hot+Springs+Costa+Rica",
  },
  {
    id: "don-rufino",
    name: "Don Rufino",
    category: "restaurants",
    subcategory: "Cocina Costarricense",
    description: "Restaurante galardonado que fusiona la cocina tradicional costarricense con tecnicas modernas. Menu de temporada con ingredientes locales y excelente carta de vinos.",
    location: { lat: 10.4679, lng: -84.6432, city: "La Fortuna", country: "Costa Rica", address: "Calle Principal, centro de La Fortuna" },
    rating: 4.6,
    reviewCount: 1234,
    priceLevel: 3,
    images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80"],
    phone: "+506 2479 9997",
    website: "https://donrufino.com",
    openingHours: ["Lun-Dom: 11:00 AM - 10:00 PM"],
    googleMapsUrl: "https://maps.google.com/?q=Don+Rufino+La+Fortuna",
  },
  {
    id: "rain-forest-cafe",
    name: "Rain Forest Cafe",
    category: "cafes",
    subcategory: "Cafe",
    description: "Cafe acogedor con los mejores granos de la region de los Santos. Postres artesanales, desayunos tipicos y un ambiente tranquilo para trabajar o relajarse.",
    location: { lat: 10.4683, lng: -84.6421, city: "La Fortuna", country: "Costa Rica", address: "Avenida Central, La Fortuna" },
    rating: 4.5,
    reviewCount: 432,
    priceLevel: 2,
    images: ["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80"],
    phone: "+506 2479 7239",
    openingHours: ["Lun-Dom: 6:30 AM - 8:00 PM"],
    googleMapsUrl: "https://maps.google.com/?q=Rain+Forest+Cafe+La+Fortuna",
  },
  {
    id: "volcano-brewing",
    name: "Volcano Brewing Co.",
    category: "bars",
    subcategory: "Cerveceria Artesanal",
    description: "La primera cerveceria artesanal de La Fortuna. Cervezas unicas inspiradas en la region: Lava Red Ale, Arenal IPA y Rainforest Stout. Maridaje con tapas locales.",
    location: { lat: 10.4675, lng: -84.6441, city: "La Fortuna", country: "Costa Rica", address: "100m oeste del parque central" },
    rating: 4.4,
    reviewCount: 321,
    priceLevel: 2,
    images: ["https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=600&q=80"],
    phone: "+506 2479 8039",
    website: "https://volcanobrewing.cr",
    openingHours: ["Mar-Dom: 12:00 PM - 11:00 PM", "Lun: Cerrado"],
    googleMapsUrl: "https://maps.google.com/?q=Volcano+Brewing+La+Fortuna",
  },
]

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  restaurants: "Restaurantes",
  attractions: "Atracciones",
  cafes: "Cafes",
  bars: "Bares",
  museums: "Museos",
  nature: "Naturaleza",
}

// Convert a Place to PlaceData for activity linking (enables hover cards)
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
    images: place.images?.slice(0, 2),
    googleMapsUrl: place.googleMapsUrl || `https://www.google.com/maps/place/?q=place_id:${place.id}`,
    phone: place.phone,
    website: place.website,
    openingHours: place.openingHours,
  }
}

// Star rating display
function StarRating({ rating, reviewCount }: { rating: number; reviewCount?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-3.5 h-3.5 ${star <= rating ? "text-amber-400 fill-amber-400" : "text-gray-300 fill-gray-300"}`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-sm font-medium text-foreground">{rating.toFixed(1)}</span>
      {reviewCount && (
        <span className="text-sm text-muted-foreground">({reviewCount.toLocaleString()})</span>
      )}
    </div>
  )
}

function PriceLevel({ level }: { level?: number }) {
  if (!level) return null
  return (
    <span className="text-sm text-muted-foreground ml-2">
      {"$".repeat(level)}
    </span>
  )
}

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

  return { lat: 9.9281, lng: -84.0907 }
}

export function ExploreTab({ plan, onUpdatePlan }: ExploreTabProps) {
  const [activeCategory, setActiveCategory] = useState<PlaceCategory>("attractions")
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [usingMockData, setUsingMockData] = useState(false)
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null)
  const [carouselPlace, setCarouselPlace] = useState<Place | null>(null)

  // Search state
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInputValue, setSearchInputValue] = useState(plan.trip.destination)
  const [currentDestination, setCurrentDestination] = useState(plan.trip.destination)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)

  const { suggestions: searchSuggestions, isLoading: searchLoading, search: performSearch } = useDestinationSearch()

  // Get current destination coordinates
  const destinationCoords = getDestinationCoords(currentDestination)

  // Calculate nearby places with distances
  const nearbyPlaces = NEARBY_DESTINATIONS
    .map(place => ({
      ...place,
      distance: calculateDistance(
        destinationCoords.lat,
        destinationCoords.lng,
        place.coords.lat,
        place.coords.lng
      )
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10)

  // Handle search input change
  const handleSearchInputChange = useCallback((value: string) => {
    setSearchQuery(value)
    setSearchInputValue(value)
    if (value.length >= 2) {
      performSearch(value)
    }
  }, [performSearch])

  // Handle selecting a nearby place
  const handleSelectNearbyPlace = useCallback((place: typeof nearbyPlaces[0]) => {
    setCurrentDestination(place.name)
    setSearchInputValue(place.name)
    setSearchOpen(false)
    setSearchQuery("")
  }, [])

  // Handle selecting a search suggestion
  const handleSelectSuggestion = useCallback((suggestion: { mainText: string; description: string }) => {
    setCurrentDestination(suggestion.mainText)
    setSearchInputValue(suggestion.mainText)
    setSearchOpen(false)
    setSearchQuery("")
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false)
        setSearchInputValue(currentDestination)
        setSearchQuery("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [currentDestination])

  // Handle escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchOpen(false)
        setSearchInputValue(currentDestination)
        setSearchQuery("")
        searchInputRef.current?.blur()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [currentDestination])

  const showSearchResults = searchQuery.length >= 2 && searchSuggestions.length > 0

  const { places: apiPlaces, isLoading } = usePlaces({
    destination: currentDestination,
    location: destinationCoords,
    category: activeCategory,
    enabled: true,
  })

  const displayPlaces = apiPlaces.length > 0
    ? apiPlaces
    : MOCK_PLACES.filter(p => p.category === activeCategory)

  useEffect(() => {
    if (!isLoading) {
      setUsingMockData(apiPlaces.length === 0)
    }
  }, [apiPlaces, isLoading])

  const availableCategories: PlaceCategory[] = ["attractions", "nature", "restaurants", "cafes", "bars"]

  const handleAddToTrip = (place: Place) => {
    setSelectedPlace(place)
    setSelectedDay(1)
    setIsModalOpen(true)
  }

  const handleConfirmAdd = () => {
    if (!selectedPlace) return

    const dayIndex = plan.itinerary.findIndex(d => d.day === selectedDay)
    if (dayIndex === -1) return

    // First, ensure the place is saved with full data
    let updatedSavedPlaces = plan.savedPlaces || []
    const existingSaved = updatedSavedPlaces.find(
      p => p.sourceInfo?.sourceId === selectedPlace.id || p.placeId === selectedPlace.id
    )

    let savedPlaceId: string
    if (!existingSaved) {
      const newSavedPlace = createSavedPlaceFromPlace(selectedPlace)
      newSavedPlace.addedToItineraryDay = selectedDay
      savedPlaceId = newSavedPlace.id
      updatedSavedPlaces = [...updatedSavedPlaces, newSavedPlace]
    } else {
      savedPlaceId = existingSaved.id
      // Update the day reference if adding to itinerary
      updatedSavedPlaces = updatedSavedPlaces.map(p =>
        p.id === existingSaved.id
          ? { ...p, addedToItineraryDay: selectedDay }
          : p
      )
    }

    const newEntry: TimelineEntry = {
      id: `${selectedPlace.id}-${Date.now()}`,
      time: "Por definir",
      activity: selectedPlace.name,
      location: selectedPlace.location.city || plan.trip.destination,
      icon: getIconForCategory(selectedPlace.category),
      notes: selectedPlace.description,
      // Include place data for hover cards
      placeId: selectedPlace.id,
      placeData: placeToPlaceData(selectedPlace),
    }

    const updatedItinerary = [...plan.itinerary]
    updatedItinerary[dayIndex] = {
      ...updatedItinerary[dayIndex],
      timeline: [...updatedItinerary[dayIndex].timeline, newEntry],
    }

    onUpdatePlan({
      ...plan,
      itinerary: updatedItinerary,
      savedPlaces: updatedSavedPlaces,
      updatedAt: new Date().toISOString(),
    })

    setIsModalOpen(false)
    setSelectedPlace(null)
  }

  const handleSavePlace = (place: Place) => {
    // Check if already saved using sourceInfo.sourceId or legacy placeId
    const isAlreadySaved = (plan.savedPlaces || []).some(
      p => p.sourceInfo?.sourceId === place.id || p.placeId === place.id
    )
    if (isAlreadySaved) return

    // Use utility function to create SavedPlace with all data
    const savedPlace = createSavedPlaceFromPlace(place)

    onUpdatePlan({
      ...plan,
      savedPlaces: [...(plan.savedPlaces || []), savedPlace],
      updatedAt: new Date().toISOString(),
    })
  }

  const isPlaceSaved = (placeId: string): boolean => {
    return (plan.savedPlaces || []).some(
      p => p.sourceInfo?.sourceId === placeId || p.placeId === placeId
    )
  }

  const getIconForCategory = (category: PlaceCategory): string => {
    const icons: Record<PlaceCategory, string> = {
      attractions: "landmark",
      nature: "tree",
      restaurants: "fork",
      cafes: "coffee",
      bars: "glass",
      museums: "building",
    }
    return icons[category] || "pin"
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  }

  return (
    <div className="space-y-4">
      {/* Header with Search + Category Tabs */}
      <div className="space-y-4">
        {/* Top row: Search bar */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchInputValue}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search destinations..."
              className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="animate-spin w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
          </div>

          {/* Search Dropdown */}
          {searchOpen && (
            <div
              ref={searchDropdownRef}
              className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-[60vh] overflow-y-auto"
            >
              {/* Search Results */}
              {showSearchResults && (
                <div className="py-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Search results
                  </div>
                  {searchSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.placeId}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                      </div>
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
                <div className="py-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Nearby places
                  </div>
                  {nearbyPlaces.map((place) => (
                    <button
                      key={place.id}
                      onClick={() => handleSelectNearbyPlace(place)}
                      className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-muted/50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10">
                          <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{place.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{place.fullName}</div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                        {formatDistance(place.distance)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* No results */}
              {searchQuery.length >= 2 && searchSuggestions.length === 0 && !searchLoading && (
                <div className="py-8 text-center">
                  <div className="text-sm text-muted-foreground">No destinations found for "{searchQuery}"</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom row: Title + Category Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-semibold">Explorar {currentDestination}</h2>
            {usingMockData && !isLoading && (
              <p className="text-xs text-amber-600 mt-1">
                Mostrando datos de ejemplo
              </p>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`
                  px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all rounded-full
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
        </div>
      </div>

      {/* Main Content: List + Map */}
      <div className="flex gap-4 lg:gap-6 relative">
        {/* Places List - scrollable */}
        <div className="flex-1 min-w-0 max-h-[600px] overflow-y-auto pr-2 space-y-2">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 p-4 border border-border rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded animate-pulse w-2/3" />
                    <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
                    <div className="h-4 bg-muted rounded animate-pulse w-full" />
                  </div>
                  <div className="w-24 h-20 bg-muted rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          ) : displayPlaces.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">No hay lugares</h3>
              <p className="text-muted-foreground text-sm">
                No encontramos {CATEGORY_LABELS[activeCategory].toLowerCase()} en {currentDestination}.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayPlaces.map((place, index) => (
                <div
                  key={place.id}
                  className={`
                    flex gap-3 p-3 rounded-lg border transition-all cursor-pointer
                    ${hoveredPlaceId === place.id || selectedPlace?.id === place.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50 bg-background"
                    }
                  `}
                  onMouseEnter={() => setHoveredPlaceId(place.id)}
                  onMouseLeave={() => setHoveredPlaceId(null)}
                  onClick={() => setSelectedPlace(place)}
                >
                  {/* Number Badge */}
                  <div className={`
                    flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold
                    ${hoveredPlaceId === place.id || selectedPlace?.id === place.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                    }
                  `}>
                    {index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-foreground leading-tight truncate">
                      {place.name}
                    </h3>

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
                      <PriceLevel level={place.priceLevel} />
                    </div>

                    {/* Description */}
                    {place.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {place.description}
                      </p>
                    )}

                    {/* Action dropdown */}
                    <div className="flex items-center gap-3 mt-1.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            + Añadir al viaje
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSavePlace(place)
                            }}
                            disabled={isPlaceSaved(place.id)}
                            className="flex items-center gap-2"
                          >
                            <MapPin className="w-4 h-4" />
                            <span>{isPlaceSaved(place.id) ? "Ya guardado" : "Lugares por visitar"}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddToTrip(place)
                            }}
                            className="flex items-center gap-2"
                          >
                            <CalendarPlus className="w-4 h-4" />
                            <span>Añadir al itinerario</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Image - Right side */}
                  {place.images[0] && (
                    <div
                      className="flex-shrink-0 w-20 h-20 relative rounded-lg overflow-hidden group"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCarouselPlace(place)
                      }}
                    >
                      <Image
                        src={place.images[0]}
                        alt={place.name}
                        fill
                        sizes="80px"
                        className="object-cover transition-transform group-hover:scale-105"
                        unoptimized={place.images[0].includes("googleapis.com")}
                      />
                      {place.images.length > 1 && (
                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                          +{place.images.length - 1}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Results count */}
          {!isLoading && displayPlaces.length > 0 && (
            <p className="text-sm text-muted-foreground pt-4 text-center">
              Mostrando {displayPlaces.length} {CATEGORY_LABELS[activeCategory].toLowerCase()}
            </p>
          )}
        </div>

        {/* Map + Detail Panel */}
        <div className="hidden lg:block w-[380px] flex-shrink-0 sticky top-4 self-start space-y-3">
          {/* Map - reduced height */}
          <div className="h-[250px] rounded-xl overflow-hidden border border-border">
            <PlaceMap
              places={displayPlaces}
              center={destinationCoords}
              selectedPlaceId={hoveredPlaceId || selectedPlace?.id}
              onPlaceSelect={(id) => {
                const place = displayPlaces.find(p => p.id === id)
                if (place) setSelectedPlace(place)
              }}
            />
          </div>

          {/* Place Detail Panel - below map */}
          <PlaceDetailPanel
            place={selectedPlace}
            isOpen={!!selectedPlace}
            onClose={() => setSelectedPlace(null)}
            onAddToTrip={handleAddToTrip}
            onSavePlace={handleSavePlace}
            isPlaceSaved={selectedPlace ? isPlaceSaved(selectedPlace.id) : false}
            inline={true}
            placeIndex={selectedPlace ? displayPlaces.findIndex(p => p.id === selectedPlace.id) : undefined}
          />
        </div>
      </div>

      {/* Add to Day Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to itinerary</DialogTitle>
            <DialogDescription>
              Select which day to add {selectedPlace?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-3 max-h-[280px] overflow-y-auto">
            {plan.itinerary.map((day) => (
              <label
                key={day.day}
                className={`
                  flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors
                  ${selectedDay === day.day
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                  }
                `}
              >
                <input
                  type="radio"
                  name="day"
                  value={day.day}
                  checked={selectedDay === day.day}
                  onChange={() => setSelectedDay(day.day)}
                  className="sr-only"
                />
                <div className={`
                  w-8 h-8 rounded-md flex items-center justify-center text-xs font-semibold
                  ${selectedDay === day.day
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                  }
                `}>
                  {day.day}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-tight">{day.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(day.date)}</p>
                </div>
                {selectedDay === day.day && (
                  <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </label>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleConfirmAdd}>
              Add to Day {selectedDay}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Carousel Modal */}
      {carouselPlace && carouselPlace.images.length > 0 && (
        <ImageCarousel
          images={carouselPlace.images}
          title={carouselPlace.name}
          onClose={() => setCarouselPlace(null)}
        />
      )}
    </div>
  )
}
