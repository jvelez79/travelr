/**
 * SearchPage Component
 *
 * Container layout for the search page.
 * Orchestrates header, results grid, and map.
 */

"use client"

import { SearchHeader } from "./SearchHeader"
import { SearchResults } from "./SearchResults"
import { SearchMap } from "./SearchMap"
import { SearchMapPopup } from "./SearchMapPopup"
import type { Place, PlaceCategory, Coordinates } from "@/types/explore"
import type { GeneratedPlan, ItineraryDay } from "@/types/plan"

interface Trip {
  id: string
  destination: string
}

interface SearchPageProps {
  tripId: string
  trip: Trip
  plan: GeneratedPlan | null
  thingsToDoPlaceIds: Set<string>
  // Search state
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory: PlaceCategory
  onCategoryChange: (category: PlaceCategory) => void
  // Results state
  places: Place[]
  loading: boolean
  // Pagination state
  isLoadingMore: boolean
  hasMore: boolean
  onLoadMore: () => void
  // Hover/Selection state (shared)
  hoveredPlaceId: string | null
  onHoverPlace: (placeId: string | null) => void
  selectedPlaceId: string | null
  onSelectPlace: (placeId: string | null) => void
  // Map state
  mapCenter: Coordinates
  mapBounds: google.maps.LatLngBounds | null
  onMapBoundsChange: (bounds: google.maps.LatLngBounds | null) => void
  onMapIdle: () => void
  onMapLoad: (map: google.maps.Map) => void
  // Actions
  onAddToThingsToDo: (place: Place) => Promise<void>
  onAddToDay: (place: Place, dayNumber: number) => Promise<void>
}

export function SearchPage({
  tripId,
  trip,
  plan,
  thingsToDoPlaceIds,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  places,
  loading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  hoveredPlaceId,
  onHoverPlace,
  selectedPlaceId,
  onSelectPlace,
  mapCenter,
  onMapLoad,
  onMapIdle,
  onAddToThingsToDo,
  onAddToDay,
}: SearchPageProps) {
  const days: ItineraryDay[] = plan?.itinerary || []

  // Find selected place for popup
  const selectedPlace = places.find((p) => p.id === selectedPlaceId)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <SearchHeader
        tripId={tripId}
        destination={trip.destination}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
      />

      {/* Main content: Grid + Map */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Results grid */}
        <SearchResults
          places={places}
          loading={loading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          hoveredPlaceId={hoveredPlaceId}
          selectedPlaceId={selectedPlaceId}
          onHoverPlace={onHoverPlace}
          onSelectPlace={onSelectPlace}
          onAddToThingsToDo={onAddToThingsToDo}
          onAddToDay={onAddToDay}
          days={days}
          thingsToDoPlaceIds={thingsToDoPlaceIds}
        />

        {/* Map */}
        <SearchMap
          places={places}
          center={mapCenter}
          bounds={null}
          hoveredPlaceId={hoveredPlaceId}
          selectedPlaceId={selectedPlaceId}
          onPlaceSelect={onSelectPlace}
          onMapLoad={onMapLoad}
          onMapIdle={onMapIdle}
          className="w-full lg:w-[40%] h-64 lg:h-auto lg:sticky lg:top-[73px] lg:max-h-[calc(100vh-73px)]"
        />
      </div>

      {/* Popup modal */}
      {selectedPlace && (
        <SearchMapPopup
          place={selectedPlace}
          onClose={() => onSelectPlace(null)}
          onAddToThingsToDo={() => onAddToThingsToDo(selectedPlace)}
          onAddToDay={(dayNum) => onAddToDay(selectedPlace, dayNum)}
          days={days}
          isAdded={thingsToDoPlaceIds.has(selectedPlace.id)}
        />
      )}
    </div>
  )
}
