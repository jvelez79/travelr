"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Compass, Sparkles, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useTrip } from "@/hooks/useTrips"
import { usePlan } from "@/hooks/usePlan"
import { useThingsToDo, useAddToThingsToDo } from "@/hooks/useThingsToDo"
import { useCuratedDiscovery } from "@/hooks/useCuratedDiscovery"
import { useAuth } from "@/contexts/AuthContext"
import { CategoryFilters } from "@/components/explore/CategoryFilters"
import { PlaceGrid } from "@/components/explore/PlaceGrid"
import { PlaceDetailsModal } from "@/components/explore/PlaceDetailsModal"
import { CuratedDiscoveryView } from "@/components/explore/CuratedDiscoveryView"
import { cn } from "@/lib/utils"
import type { Place } from "@/types/explore"
import type { CuratedPlace } from "@/types/curated"
import type { GeneratedPlan } from "@/types/plan"

// Simplified categories for MVP
export type ExploreCategory = 'attractions' | 'food_drink' | 'tours' | 'activities'

interface CategoryConfig {
  id: ExploreCategory
  label: string
  googleTypes: string[]
}

const EXPLORE_CATEGORIES: CategoryConfig[] = [
  {
    id: 'attractions',
    label: 'Attractions',
    googleTypes: ['tourist_attraction', 'museum', 'point_of_interest', 'landmark'],
  },
  {
    id: 'food_drink',
    label: 'Food & Drink',
    googleTypes: ['restaurant', 'cafe', 'bar', 'bakery'],
  },
  {
    id: 'tours',
    label: 'Tours',
    googleTypes: ['travel_agency'],
  },
  {
    id: 'activities',
    label: 'Activities',
    googleTypes: ['park', 'spa', 'gym', 'amusement_park'],
  },
]

// Explore mode types
type ExploreMode = 'curated' | 'browse'

export default function ExplorePage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  useAuth() // Ensures user is authenticated
  const { trip, loading: tripLoading } = useTrip(tripId)
  const { planData, loading: planLoading } = usePlan(tripId)
  const { items: thingsToDoItems, refetch: refetchThingsToDo } = useThingsToDo(tripId)
  const { addItem, loading: addingItem } = useAddToThingsToDo()

  // Get itinerary days from plan
  const plan = planData as GeneratedPlan | null
  const itineraryDays = plan?.itinerary || []

  // Curated discovery hook
  const {
    data: curatedData,
    loading: curatedLoading,
    error: curatedError,
    refresh: refreshCurated,
  } = useCuratedDiscovery({
    tripId,
    destination: trip?.destination || null,
    autoFetch: true,
  })

  // Mode toggle state (default to curated)
  const [exploreMode, setExploreMode] = useState<ExploreMode>('curated')

  // Browse mode state
  const [selectedCategory, setSelectedCategory] = useState<ExploreCategory>('attractions')
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Get place IDs already in Things To Do
  const thingsToDoPlaceIds = new Set(thingsToDoItems.map(item => item.google_place_id))

  // Fetch places when category or destination changes
  const fetchPlaces = useCallback(async (pageToken?: string) => {
    if (!trip?.destination) return

    // If no pageToken, we're loading fresh data
    if (!pageToken) {
      setLoading(true)
      setPlaces([])
      setNextPageToken(null)
    } else {
      setLoadingMore(true)
    }

    try {
      const categoryConfig = EXPLORE_CATEGORIES.find(c => c.id === selectedCategory)
      if (!categoryConfig) return

      // Use the first Google type for search via API route
      const googleType = categoryConfig.googleTypes[0]
      const params = new URLSearchParams({
        destination: trip.destination,
        googleType,
      })

      // Add pageToken if we're loading more
      if (pageToken) {
        params.append('pageToken', pageToken)
      }

      const response = await fetch(`/api/explore/places?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch places')
      }

      const data = await response.json()

      if (pageToken) {
        // Append to existing places
        setPlaces(prev => [...prev, ...(data.places || [])])
      } else {
        // Replace places
        setPlaces(data.places || [])
      }

      // Save nextPageToken for "Load More"
      setNextPageToken(data.nextPageToken || null)
    } catch (error) {
      console.error('Error fetching places:', error)
      if (!pageToken) {
        setPlaces([])
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [trip?.destination, selectedCategory])

  useEffect(() => {
    fetchPlaces()
  }, [fetchPlaces])

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (nextPageToken && !loadingMore) {
      fetchPlaces(nextPageToken)
    }
  }, [nextPageToken, loadingMore, fetchPlaces])

  // Handle add to Things To Do
  const handleAddToThingsToDo = async (place: Place) => {
    if (!tripId) return

    const result = await addItem({
      tripId,
      googlePlaceId: place.id,
      placeData: {
        name: place.name,
        formatted_address: place.location.address,
        rating: place.rating,
        user_ratings_total: place.reviewCount,
        types: [selectedCategory],
        photos: place.images.map(url => ({ photo_reference: url })),
        geometry: {
          location: { lat: place.location.lat, lng: place.location.lng },
        },
      },
      category: selectedCategory,
    })

    if (result) {
      refetchThingsToDo()
    }
  }

  // Handle place card click
  const handlePlaceClick = (place: Place) => {
    setSelectedPlace(place)
    setIsModalOpen(true)
  }

  // Handle curated place add to Things To Do
  const handleCuratedAddToThingsToDo = async (place: CuratedPlace) => {
    if (!tripId) return

    const result = await addItem({
      tripId,
      googlePlaceId: place.id,
      placeData: {
        name: place.name,
        formatted_address: place.location.address,
        rating: place.rating,
        user_ratings_total: place.reviewCount,
        types: [place.category],
        photos: place.images.map(url => ({ photo_reference: url })),
        geometry: {
          location: { lat: place.location.lat, lng: place.location.lng },
        },
      },
      category: place.category === 'restaurants' ? 'food_drink' : 'attractions',
    })

    if (result) {
      refetchThingsToDo()
    }
  }

  // Handle curated place add to specific day
  // For MVP, adds to Things To Do. User can drag to specific day in canvas.
  // Future: Could directly add to day's timeline
  const handleCuratedAddToDay = async (place: CuratedPlace, _dayNumber: number) => {
    // For now, just add to Things To Do
    // The user can then drag it to their preferred day in the canvas
    await handleCuratedAddToThingsToDo(place)
  }

  // Loading state
  if (tripLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-14 border-b border-border px-4 flex items-center">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="h-64 rounded-xl" />
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
          <h1 className="text-xl font-semibold mb-2">Trip not found</h1>
          <p className="text-muted-foreground">The trip you&apos;re looking for doesn&apos;t exist.</p>
        </div>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border bg-background sticky top-0 z-10">
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => router.push(`/trips/${tripId}/planning`)}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Canvas</span>
            </Button>
          </div>

          <div className="text-center">
            <h1 className="font-semibold text-sm sm:text-base">
              Explore {trip.destination}
            </h1>
          </div>

          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Page title and mode toggle */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Things to Do in {trip.destination}</h2>
            <p className="text-muted-foreground mt-1">
              Discover and save places to your Things To Do list
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setExploreMode('curated')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                exploreMode === 'curated'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Sparkles className="w-4 h-4" />
              Descubrir
            </button>
            <button
              onClick={() => setExploreMode('browse')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                exploreMode === 'browse'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Search className="w-4 h-4" />
              Explorar
            </button>
          </div>
        </div>

        {/* Curated Discovery View */}
        {exploreMode === 'curated' && (
          <CuratedDiscoveryView
            data={curatedData}
            loading={curatedLoading}
            error={curatedError}
            destination={trip.destination}
            days={itineraryDays}
            onRefresh={refreshCurated}
            onAddToThingsToDo={handleCuratedAddToThingsToDo}
            onAddToDay={handleCuratedAddToDay}
            addedPlaceIds={thingsToDoPlaceIds}
          />
        )}

        {/* Browse View (original) */}
        {exploreMode === 'browse' && (
          <>
            {/* Category filters */}
            <CategoryFilters
              categories={EXPLORE_CATEGORIES}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Places grid */}
            <PlaceGrid
              places={places}
              loading={loading}
              loadingMore={loadingMore}
              hasMore={!!nextPageToken}
              thingsToDoPlaceIds={thingsToDoPlaceIds}
              onPlaceClick={handlePlaceClick}
              onAddToThingsToDo={handleAddToThingsToDo}
              onLoadMore={handleLoadMore}
              addingItem={addingItem}
            />
          </>
        )}
      </main>

      {/* Place details modal */}
      <PlaceDetailsModal
        place={selectedPlace}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedPlace(null)
        }}
        isInThingsToDo={selectedPlace ? thingsToDoPlaceIds.has(selectedPlace.id) : false}
        onAddToThingsToDo={handleAddToThingsToDo}
        addingItem={addingItem}
      />
    </div>
  )
}
