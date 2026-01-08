"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useTrip } from "@/hooks/useTrips"
import { useThingsToDo, useAddToThingsToDo } from "@/hooks/useThingsToDo"
import { useAuth } from "@/contexts/AuthContext"
import { CategoryFilters } from "@/components/explore/CategoryFilters"
import { PlaceGrid } from "@/components/explore/PlaceGrid"
import { PlaceDetailsModal } from "@/components/explore/PlaceDetailsModal"
import type { Place } from "@/types/explore"

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

export default function ExplorePage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  const { user } = useAuth()
  const { trip, loading: tripLoading } = useTrip(tripId)
  const { items: thingsToDoItems, refetch: refetchThingsToDo } = useThingsToDo(tripId)
  const { addItem, loading: addingItem } = useAddToThingsToDo()

  const [selectedCategory, setSelectedCategory] = useState<ExploreCategory>('attractions')
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Get place IDs already in Things To Do
  const thingsToDoPlaceIds = new Set(thingsToDoItems.map(item => item.google_place_id))

  // Fetch places when category or destination changes
  const fetchPlaces = useCallback(async () => {
    if (!trip?.destination) return

    setLoading(true)
    try {
      const categoryConfig = EXPLORE_CATEGORIES.find(c => c.id === selectedCategory)
      if (!categoryConfig) return

      // Use the first Google type for search via API route
      const googleType = categoryConfig.googleTypes[0]
      const params = new URLSearchParams({
        destination: trip.destination,
        googleType,
      })

      const response = await fetch(`/api/explore/places?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch places')
      }

      const data = await response.json()
      setPlaces(data.places || [])
    } catch (error) {
      console.error('Error fetching places:', error)
      setPlaces([])
    } finally {
      setLoading(false)
    }
  }, [trip?.destination, selectedCategory])

  useEffect(() => {
    fetchPlaces()
  }, [fetchPlaces])

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
          <p className="text-muted-foreground">The trip you're looking for doesn't exist.</p>
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
        {/* Page title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Things to Do in {trip.destination}</h2>
          <p className="text-muted-foreground mt-1">
            Discover and save places to your Things To Do list
          </p>
        </div>

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
          thingsToDoPlaceIds={thingsToDoPlaceIds}
          onPlaceClick={handlePlaceClick}
          onAddToThingsToDo={handleAddToThingsToDo}
          addingItem={addingItem}
        />
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
