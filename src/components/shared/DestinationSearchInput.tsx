"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, MapPin, Loader2 } from "lucide-react"
import { useDestinationSearch } from "@/lib/explore/hooks"
import type { Coordinates } from "@/types/explore"

interface NearbyPlace {
  id: string
  name: string
  fullName: string
  coords: Coordinates
  distance?: number
}

interface DestinationSearchInputProps {
  value: string
  onChange: (destination: string, coords?: Coordinates) => void
  placeholder?: string
  className?: string
  nearbyPlaces?: NearbyPlace[]
  showNearbyPlaces?: boolean
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

// Nearby destinations grouped by region (Costa Rica focused)
const DEFAULT_NEARBY_DESTINATIONS: NearbyPlace[] = [
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

export function DestinationSearchInput({
  value,
  onChange,
  placeholder = "Search destinations...",
  className = "",
  nearbyPlaces,
  showNearbyPlaces = true,
}: DestinationSearchInputProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInputValue, setSearchInputValue] = useState(value)
  const [dynamicNearbyPlaces, setDynamicNearbyPlaces] = useState<NearbyPlace[]>([])
  const [isLoadingNearby, setIsLoadingNearby] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)

  const { suggestions: searchSuggestions, isLoading: searchLoading, search: performSearch } = useDestinationSearch()

  // Update input value when prop value changes
  useEffect(() => {
    setSearchInputValue(value)
  }, [value])

  // Get current destination coordinates
  const destinationCoords = getDestinationCoords(value)

  // Fetch nearby places when dropdown opens
  useEffect(() => {
    if (searchOpen && !searchQuery && showNearbyPlaces && destinationCoords.lat !== 0) {
      setIsLoadingNearby(true)
      fetch(`/api/explore/destinations?lat=${destinationCoords.lat}&lng=${destinationCoords.lng}`)
        .then(res => res.json())
        .then(data => {
          if (data.nearby) {
            const places: NearbyPlace[] = data.nearby.map((place: {
              placeId: string
              name: string
              fullName: string
              location: Coordinates
            }) => ({
              id: place.placeId,
              name: place.name,
              fullName: place.fullName,
              coords: place.location,
              distance: calculateDistance(
                destinationCoords.lat,
                destinationCoords.lng,
                place.location.lat,
                place.location.lng
              )
            }))
            setDynamicNearbyPlaces(places)
          }
        })
        .catch(err => {
          console.error("Error loading nearby places:", err)
          setDynamicNearbyPlaces([])
        })
        .finally(() => {
          setIsLoadingNearby(false)
        })
    }
  }, [searchOpen, searchQuery, showNearbyPlaces, destinationCoords.lat, destinationCoords.lng])

  // Use provided nearby places or dynamic ones
  const computedNearbyPlaces = nearbyPlaces || dynamicNearbyPlaces

  // Handle search input change
  const handleSearchInputChange = useCallback((inputValue: string) => {
    setSearchQuery(inputValue)
    setSearchInputValue(inputValue)
    if (inputValue.length >= 2) {
      performSearch(inputValue)
    }
  }, [performSearch])

  // Handle selecting a nearby place
  const handleSelectNearbyPlace = useCallback((place: typeof computedNearbyPlaces[0]) => {
    onChange(place.name, place.coords)
    setSearchInputValue(place.name)
    setSearchOpen(false)
    setSearchQuery("")
  }, [onChange])

  // Handle selecting a search suggestion
  const handleSelectSuggestion = useCallback((suggestion: { mainText: string; description: string }) => {
    onChange(suggestion.mainText)
    setSearchInputValue(suggestion.mainText)
    setSearchOpen(false)
    setSearchQuery("")
  }, [onChange])

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
        setSearchInputValue(value)
        setSearchQuery("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [value])

  // Handle escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchOpen(false)
        setSearchInputValue(value)
        setSearchQuery("")
        searchInputRef.current?.blur()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [value])

  const showSearchResults = searchQuery.length >= 2 && searchSuggestions.length > 0

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchInputValue}
          onChange={(e) => handleSearchInputChange(e.target.value)}
          onFocus={() => setSearchOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        {searchLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
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
          {!showSearchResults && showNearbyPlaces && (
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Nearby places
              </div>

              {/* Loading state */}
              {isLoadingNearby && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                </div>
              )}

              {/* Nearby places list */}
              {!isLoadingNearby && computedNearbyPlaces.length > 0 && computedNearbyPlaces.map((place) => (
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
                  {place.distance !== undefined && (
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      {formatDistance(place.distance)}
                    </span>
                  )}
                </button>
              ))}

              {/* No nearby places */}
              {!isLoadingNearby && computedNearbyPlaces.length === 0 && (
                <div className="py-8 text-center">
                  <div className="text-sm text-muted-foreground">No nearby destinations found</div>
                  <div className="text-xs text-muted-foreground mt-1">Try searching for a city or country</div>
                </div>
              )}
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
  )
}
