"use client"

import { ReservationsHeader } from "./ReservationsHeader"
import { NotesSection } from "./NotesSection"
import { FlightsSection } from "./FlightsSection"
import { LodgingSection } from "./LodgingSection"
import { PlacesToVisitSection } from "./PlacesToVisitSection"
import type { GeneratedPlan, FlightReservation, SavedPlace } from "@/types/plan"
import type { Accommodation } from "@/types/accommodation"

interface OverviewTabProps {
  plan: GeneratedPlan
  onUpdatePlan: (plan: GeneratedPlan) => void
}

export function OverviewTab({ plan, onUpdatePlan }: OverviewTabProps) {
  const accommodations = plan.accommodations || []

  const counts = {
    flights: plan.flights?.length || 0,
    lodging: accommodations.length,
    rentalCars: 0, // TODO: Add rental car support in the future
    restaurants: 0,
    attachments: 0,
    other: 0,
  }

  const handleIconClick = (section: string) => {
    const element = document.getElementById(section)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const handleAddFlight = (flight: FlightReservation) => {
    onUpdatePlan({
      ...plan,
      flights: [...(plan.flights || []), flight],
      updatedAt: new Date().toISOString(),
    })
  }

  const handleDeleteFlight = (id: string) => {
    onUpdatePlan({
      ...plan,
      flights: (plan.flights || []).filter((f) => f.id !== id),
      updatedAt: new Date().toISOString(),
    })
  }

  const handleUpdateFlight = (id: string, updates: Partial<FlightReservation>) => {
    onUpdatePlan({
      ...plan,
      flights: (plan.flights || []).map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
      updatedAt: new Date().toISOString(),
    })
  }

  const handleAddPlace = (place: SavedPlace) => {
    onUpdatePlan({
      ...plan,
      savedPlaces: [...(plan.savedPlaces || []), place],
      updatedAt: new Date().toISOString(),
    })
  }

  const handleDeletePlace = (id: string) => {
    onUpdatePlan({
      ...plan,
      savedPlaces: (plan.savedPlaces || []).filter((p) => p.id !== id),
      updatedAt: new Date().toISOString(),
    })
  }

  const handleAddHotel = (hotel: any) => {
    const nights = Math.ceil(
      (new Date(plan.trip.endDate).getTime() -
        new Date(plan.trip.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )

    // Transform HotelResult to Accommodation
    const newAccommodation: Accommodation = {
      id: hotel.id || crypto.randomUUID(),
      name: hotel.name,
      type: hotel.type?.toLowerCase() || "hotel",
      area: hotel.location?.area || hotel.location?.address || "",
      pricePerNight: hotel.price?.perNight,
      nights,
      checkIn: plan.trip.startDate,
      checkOut: plan.trip.endDate,
      checkInTime: hotel.checkInTime,
      checkOutTime: hotel.checkOutTime,
      amenities: hotel.amenities,
      currency: "USD",
      origin: "user_added",
      status: "pending",
      whyThisPlace: `Hotel encontrado con búsqueda en ${hotel.location?.area || ""}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onUpdatePlan({
      ...plan,
      accommodations: [...accommodations, newAccommodation],
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="space-y-6">
      {/* Description */}
      {plan.summary.description && (
        <p className="text-muted-foreground text-lg leading-relaxed text-center max-w-2xl mx-auto">
          {plan.summary.description}
        </p>
      )}

      <ReservationsHeader
        counts={counts}
        totalBudget={plan.budget?.total || 0}
        currency={plan.budget?.currency || 'USD'}
        onIconClick={handleIconClick}
      />

      <NotesSection tips={plan.tips || []} />

      <FlightsSection
        flights={plan.flights || []}
        tripStartDate={plan.trip.startDate}
        tripEndDate={plan.trip.endDate}
        tripDestination={plan.trip.destination}
        tripTravelers={plan.trip.travelers}
        onAddFlight={handleAddFlight}
        onUpdateFlight={handleUpdateFlight}
        onDeleteFlight={handleDeleteFlight}
      />

      <LodgingSection
        accommodations={accommodations}
        currency={plan.budget?.currency || 'USD'}
        tripData={{
          destination: plan.trip.destination,
          startDate: plan.trip.startDate,
          endDate: plan.trip.endDate,
          travelers: plan.trip.travelers,
        }}
        onAddHotel={handleAddHotel}
      />

      <PlacesToVisitSection
        places={plan.savedPlaces || []}
        onAddPlace={handleAddPlace}
        onDeletePlace={handleDeletePlace}
      />
    </div>
  )
}
