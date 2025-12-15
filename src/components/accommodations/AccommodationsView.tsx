"use client"

import { useState } from "react"
import { Plus, Building2, Search, Upload, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AccommodationCard } from "./AccommodationCard"
import { AddAccommodationModal } from "./AddAccommodationModal"
import type { GeneratedPlan } from "@/types/plan"
import type { AccommodationReservation } from "@/types/accommodation"

interface AccommodationsViewProps {
  plan: GeneratedPlan
  onUpdatePlan: (plan: GeneratedPlan) => void
}

export function AccommodationsView({ plan, onUpdatePlan }: AccommodationsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false)

  const reservations = plan.accommodationReservations || []
  const suggestions = plan.accommodation?.suggestions || []

  const handleReservationClick = (reservation: AccommodationReservation) => {
    // TODO: Open details panel
    console.log("View reservation:", reservation)
  }

  const handleEditReservation = (reservation: AccommodationReservation) => {
    // TODO: Open edit modal
    console.log("Edit reservation:", reservation)
  }

  const handleDeleteReservation = (reservation: AccommodationReservation) => {
    if (!confirm(`¿Eliminar la reservación en ${reservation.name}?`)) return

    const updatedReservations = reservations.filter((r) => r.id !== reservation.id)
    onUpdatePlan({
      ...plan,
      accommodationReservations: updatedReservations,
    })
  }

  const handleAddReservation = (reservation: AccommodationReservation) => {
    const updatedReservations = [...reservations, reservation]
    onUpdatePlan({
      ...plan,
      accommodationReservations: updatedReservations,
    })
  }

  const handleOpenHotelSearch = () => {
    // TODO: Open hotel search modal
    console.log("Open hotel search")
  }

  const isEmpty = reservations.length === 0 && suggestions.length === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Alojamientos
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestiona tus reservaciones de hospedaje
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar alojamiento
        </Button>
      </div>

      {/* Empty State */}
      {isEmpty && (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">Sin alojamientos</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Agrega tus reservaciones de hotel, Airbnb u otro hospedaje
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="outline" onClick={() => setShowAddModal(true)}>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar hoteles
                </Button>
                <Button variant="outline" onClick={() => setShowAddModal(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir recibo
                </Button>
                <Button variant="outline" onClick={() => setShowAddModal(true)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Forward email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmed Reservations */}
      {reservations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Reservaciones Confirmadas ({reservations.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {reservations.map((reservation) => (
              <AccommodationCard
                key={reservation.id}
                reservation={reservation}
                onClick={handleReservationClick}
                onEdit={handleEditReservation}
                onDelete={handleDeleteReservation}
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Sugerencias de la AI ({suggestions.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Sugerencia AI</p>
                      <h4 className="font-semibold">{suggestion.name}</h4>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      ${suggestion.pricePerNight}/noche
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {suggestion.area} • {suggestion.nights} noches
                  </p>
                  {suggestion.why && (
                    <p className="text-sm italic text-muted-foreground">
                      "{suggestion.why}"
                    </p>
                  )}
                  {suggestion.amenities && suggestion.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {suggestion.amenities.slice(0, 3).map((amenity, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Accommodation Modal */}
      <AddAccommodationModal
        tripId={plan.id}
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddReservation={handleAddReservation}
        onOpenHotelSearch={handleOpenHotelSearch}
      />
    </div>
  )
}
