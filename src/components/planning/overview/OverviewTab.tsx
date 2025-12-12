"use client"

import { ReservationsHeader } from "./ReservationsHeader"
import { NotesSection } from "./NotesSection"
import { FlightsSection } from "./FlightsSection"
import { LodgingSection } from "./LodgingSection"
import { PlacesToVisitSection } from "./PlacesToVisitSection"
import type { GeneratedPlan, FlightReservation, SavedPlace } from "@/types/plan"

interface OverviewTabProps {
  plan: GeneratedPlan
  onUpdatePlan: (plan: GeneratedPlan) => void
}

export function OverviewTab({ plan, onUpdatePlan }: OverviewTabProps) {
  const counts = {
    flights: plan.flights?.length || 0,
    lodging: plan.accommodation.suggestions.length,
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
    // Transform HotelResult to AccommodationSuggestion
    const accommodation = {
      id: hotel.id,
      name: hotel.name,
      type: hotel.type.toLowerCase() as "hotel" | "airbnb" | "hostel" | "mixed",
      area: hotel.location.area || hotel.location.address,
      pricePerNight: hotel.price.perNight,
      why: `Hotel encontrado con búsqueda en ${hotel.location.area || ""}`,
      nights: Math.ceil(
        (new Date(plan.trip.endDate).getTime() -
          new Date(plan.trip.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      checkIn: plan.trip.startDate,
      checkOut: plan.trip.endDate,
      checkInTime: hotel.checkInTime,
      checkOutTime: hotel.checkOutTime,
      amenities: hotel.amenities,
    }

    onUpdatePlan({
      ...plan,
      accommodation: {
        ...plan.accommodation,
        suggestions: [...plan.accommodation.suggestions, accommodation],
        totalCost:
          plan.accommodation.totalCost +
          accommodation.pricePerNight * accommodation.nights,
      },
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
        onAddFlight={handleAddFlight}
        onDeleteFlight={handleDeleteFlight}
      />

      <LodgingSection
        suggestions={plan.accommodation.suggestions}
        totalCost={plan.accommodation.totalCost}
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
