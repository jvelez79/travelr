"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useTrip } from "@/hooks/useTrips"
import { usePlan } from "@/hooks/usePlan"
import { useThingsToDo, useAddToThingsToDo } from "@/hooks/useThingsToDo"
import { useCuratedDiscovery } from "@/hooks/useCuratedDiscovery"
import { useAuth } from "@/contexts/AuthContext"
import { CuratedDiscoveryView } from "@/components/explore/CuratedDiscoveryView"
import type { CuratedPlace } from "@/types/curated"
import type { GeneratedPlan } from "@/types/plan"

export default function ExplorePage() {
  const params = useParams()
  const router = useRouter()
  const tripId = params.id as string

  useAuth() // Ensures user is authenticated
  const { trip, loading: tripLoading } = useTrip(tripId)
  const { planData } = usePlan(tripId)
  const { items: thingsToDoItems, refetch: refetchThingsToDo } = useThingsToDo(tripId)
  const { addItem } = useAddToThingsToDo()

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

  // Get place IDs already in Things To Do
  const thingsToDoPlaceIds = new Set(thingsToDoItems.map(item => item.google_place_id))

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
  const handleCuratedAddToDay = async (place: CuratedPlace, _dayNumber: number) => {
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
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
        {/* Page title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Things to Do in {trip.destination}</h2>
          <p className="text-muted-foreground mt-1">
            Discover and save places to your Things To Do list
          </p>
        </div>

        {/* Curated Discovery View */}
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
      </main>
    </div>
  )
}
