/**
 * Search Route
 *
 * Fullscreen search page for finding and adding places to trip.
 * Features:
 * - Text search with debounce
 * - Category filtering
 * - Bidirectional map sync
 * - Hover states between grid and map
 * - Add to Things To Do or specific days
 */

"use client"

import { useState, useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/AuthContext"
import { useTrip } from "@/hooks/useTrips"
import { usePlan } from "@/hooks/usePlan"
import { useThingsToDo, useAddToThingsToDo } from "@/hooks/useThingsToDo"
import { usePlaceSearch, usePlaces } from "@/lib/explore/hooks"
import { useSearchSync } from "@/hooks/useSearchSync"
import { SearchPage } from "@/components/search/SearchPage"
import type { Place, PlaceCategory, Coordinates } from "@/types/explore"
import { DEFAULT_SEARCH_CATEGORY } from "@/types/search"
import { toast } from "sonner"

export default function SearchRoute() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  useAuth() // Ensures user is authenticated

  const { trip, loading: tripLoading } = useTrip(tripId)
  const { planData } = usePlan(tripId)
  const { items: thingsToDoItems, refetch: refetchThingsToDo } = useThingsToDo(tripId)
  const { addItem } = useAddToThingsToDo()

  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory>(DEFAULT_SEARCH_CATEGORY)
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null)
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)

  // Map center (default to trip destination or fallback)
  const [mapCenter, setMapCenter] = useState<Coordinates>({
    lat: 10.0,
    lng: -84.0,
  })

  // Update map center when trip loads
  useEffect(() => {
    if (trip?.destination) {
      // For MVP, use hardcoded coordinates for common destinations
      // In production, this would come from trip.destination_coordinates or geocoding
      setMapCenter({
        lat: 10.0,
        lng: -84.0,
      })
    }
  }, [trip])

  // Text search hook
  const {
    results: searchResults,
    isSearching,
    search,
    clearResults,
  } = usePlaceSearch({
    destination: trip?.destination || "",
    location: mapCenter,
    enabled: !!trip,
    debounceMs: 300,
  })

  // Category search hook with pagination support
  const {
    places: categoryPlaces,
    isLoading: categoryLoading,
    isLoadingMore: categoryLoadingMore,
    hasMore: categoryHasMore,
    loadMore: categoryLoadMore,
  } = usePlaces({
    destination: trip?.destination || "",
    location: mapCenter,
    category: selectedCategory,
    enabled: !!trip && !searchQuery,
  })

  // Determine which results to show
  const places: Place[] = searchQuery ? searchResults : categoryPlaces

  const loading = searchQuery ? isSearching : categoryLoading

  // Pagination state (only for category search, not text search)
  const isLoadingMore = searchQuery ? false : categoryLoadingMore
  const hasMore = searchQuery ? false : categoryHasMore
  const handleLoadMore = searchQuery ? () => {} : categoryLoadMore

  // Handle search change
  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query)
      if (query.trim()) {
        search(query)
      } else {
        clearResults()
      }
    },
    [search, clearResults]
  )

  // Map sync hook
  const { onMapLoad, onMapIdle } = useSearchSync({
    places,
    onBoundsChange: (bounds) => {
      // Optional: implement re-fetch when map bounds change significantly
      console.log("Map bounds changed:", bounds)
    },
  })

  // Get place IDs already in Things To Do
  const thingsToDoPlaceIds = new Set(
    thingsToDoItems.map((item) => item.google_place_id)
  )

  // Handle add to Things To Do
  const handleAddToThingsToDo = async (place: Place) => {
    if (!tripId) return

    const result = await addItem({
      tripId,
      googlePlaceId: place.id,
      placeData: {
        name: place.name,
        formatted_address: place.location.address || "",
        rating: place.rating,
        user_ratings_total: place.reviewCount,
        types: [place.category],
        photos: place.images.map((url) => ({ photo_reference: url })),
        geometry: {
          location: { lat: place.location.lat, lng: place.location.lng },
        },
      },
      category: place.category === "restaurants" ? "food_drink" : "attractions",
    })

    if (result) {
      refetchThingsToDo()
      toast.success(`${place.name} agregado a Things To Do`)
    }
  }

  // Handle add to specific day
  const handleAddToDay = async (place: Place, dayNumber: number) => {
    // For MVP, just add to Things To Do
    // User can drag to specific day in canvas
    await handleAddToThingsToDo(place)
    toast.success(`${place.name} agregado - arrastra al día ${dayNumber} en el canvas`)
  }

  // Loading state
  if (tripLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-7xl px-4">
          <Skeleton className="h-14 w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-96 flex-1" />
            <Skeleton className="h-96 w-96" />
          </div>
        </div>
      </div>
    )
  }

  // Trip not found
  if (!trip) {
    router.push("/")
    return null
  }

  return (
    <SearchPage
      tripId={tripId}
      trip={trip}
      plan={planData as any}
      thingsToDoPlaceIds={thingsToDoPlaceIds}
      searchQuery={searchQuery}
      onSearchChange={handleSearchChange}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      places={places}
      loading={loading}
      isLoadingMore={isLoadingMore}
      hasMore={hasMore}
      onLoadMore={handleLoadMore}
      hoveredPlaceId={hoveredPlaceId}
      onHoverPlace={setHoveredPlaceId}
      selectedPlaceId={selectedPlaceId}
      onSelectPlace={setSelectedPlaceId}
      mapCenter={mapCenter}
      mapBounds={null}
      onMapBoundsChange={() => {}}
      onMapIdle={onMapIdle}
      onMapLoad={onMapLoad}
      onAddToThingsToDo={handleAddToThingsToDo}
      onAddToDay={handleAddToDay}
    />
  )
}
