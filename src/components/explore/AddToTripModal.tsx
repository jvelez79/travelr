"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { createSavedPlaceFromPlace } from "@/lib/places"
import { calculateTransportForTimeline } from "@/lib/transportUtils"
import { useTrips } from "@/hooks/useTrips"
import { usePlan, useSavePlan } from "@/hooks/usePlan"
import type { Place } from "@/types/explore"
import type { SavedPlace, PlaceData, TimelineEntry, GeneratedPlan } from "@/types/plan"

// Convert a Place to PlaceData for activity linking
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
    googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.id}`,
    phone: undefined,
    website: undefined,
    openingHours: place.openingHours,
  }
}

interface AddToTripModalProps {
  place: Place | null
  isOpen: boolean
  onClose: () => void
}

export function AddToTripModal({ place, isOpen, onClose }: AddToTripModalProps) {
  const router = useRouter()
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Use Supabase hooks
  const { trips, loading: tripsLoading } = useTrips()
  const { planData: selectedPlanData } = usePlan(selectedTripId)
  const { savePlan } = useSavePlan()

  // Auto-select first trip when trips load
  if (!selectedTripId && trips.length > 0 && !tripsLoading) {
    setSelectedTripId(trips[0].id)
  }

  const handleAddToTrip = async () => {
    if (!place || !selectedTripId) return

    setIsLoading(true)

    try {
      // Get existing plan from Supabase
      if (selectedPlanData) {
        const plan = selectedPlanData as unknown as GeneratedPlan

        // First, ensure the place is saved with full data
        const savedPlaces: SavedPlace[] = plan.savedPlaces || []
        const isAlreadySaved = savedPlaces.some(
          (p: SavedPlace) => p.sourceInfo?.sourceId === place.id || p.placeId === place.id
        )

        if (!isAlreadySaved) {
          // Create a complete SavedPlace with all data
          const newSavedPlace = createSavedPlaceFromPlace(place)
          newSavedPlace.addedToItineraryDay = 1
          plan.savedPlaces = [...savedPlaces, newSavedPlace]
        }

        // Add place to the first day's timeline (TimelineEntry format)
        if (plan.itinerary && plan.itinerary.length > 0) {
          const newTimelineEntry: TimelineEntry = {
            id: crypto.randomUUID(),
            time: "",
            activity: place.name, // TimelineEntry uses 'activity' not 'name'
            location: place.location.address || place.location.city,
            icon: place.category === "restaurants" ? "🍽️" : "🎯",
            notes: place.description || `${place.subcategory || place.category} en ${place.location.city}`,
            durationMinutes: 120, // 2 hours default
            // Store place reference with full data for hover cards
            placeId: place.id,
            placeData: placeToPlaceData(place),
          }

          // Initialize timeline array if it doesn't exist
          if (!plan.itinerary[0].timeline) {
            plan.itinerary[0].timeline = []
          }
          plan.itinerary[0].timeline.push(newTimelineEntry)

          // Calculate transport if there are activities with times defined
          const timeline = plan.itinerary[0].timeline as TimelineEntry[]
          const activitiesWithTime = timeline.filter((a: TimelineEntry) => a.time && a.time !== "")
          if (activitiesWithTime.length >= 2) {
            try {
              const timelineWithTransport = await calculateTransportForTimeline(timeline)
              plan.itinerary[0].timeline = timelineWithTransport
            } catch (error) {
              console.error("Error calculating transport:", error)
              // Continue without transport calculation
            }
          }
        }

        // Save updated plan to Supabase
        await savePlan(selectedTripId, plan as unknown as Record<string, unknown>)
      }

      // Close modal and show success
      onClose()

      // Optional: navigate to trip
      // router.push(`/trips/${selectedTripId}/planning`)
    } catch (error) {
      console.error("Error adding place to trip:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNewTrip = () => {
    // Navigate to trip creation
    // Note: The place data will need to be re-added after trip creation
    // since we don't have a server-side mechanism to pass pending places
    router.push("/trips/new")
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("es", { month: "short", day: "numeric" })
  }

  if (!place) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir a viaje</DialogTitle>
          <DialogDescription>
            Añade <strong>{place.name}</strong> a uno de tus viajes existentes o crea uno nuevo.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Place preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{place.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {place.subcategory || place.category}
              </p>
            </div>
          </div>

          {/* Trip selection */}
          {trips.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium mb-3">Selecciona un viaje:</p>
              {trips.map((trip) => (
                <label
                  key={trip.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedTripId === trip.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="trip"
                    value={trip.id}
                    checked={selectedTripId === trip.id}
                    onChange={() => setSelectedTripId(trip.id)}
                    className="sr-only"
                  />
                  <div className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${selectedTripId === trip.id ? "border-primary" : "border-muted-foreground"}
                  `}>
                    {selectedTripId === trip.id && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{trip.destination}</p>
                    {trip.start_date && trip.end_date && (
                      <p className="text-xs text-muted-foreground">
                        {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                        {(trip.travelers ?? 1) > 1 && ` · ${trip.travelers} viajeros`}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground mb-1">No tienes viajes todavía</p>
              <p className="text-xs text-muted-foreground">Crea tu primer viaje para empezar a planificar</p>
            </div>
          )}

          {/* Create new trip button */}
          <button
            onClick={handleCreateNewTrip}
            className="w-full mt-4 p-3 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear nuevo viaje
          </button>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleAddToTrip}
            disabled={!selectedTripId || isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? "Añadiendo..." : "Añadir a viaje"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
