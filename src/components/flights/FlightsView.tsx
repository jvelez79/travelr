"use client"

import { useState } from "react"
import { Plus, Plane, Search, PlaneTakeoff, PlaneLanding, ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FlightCard } from "@/components/planning/overview/FlightCard"
import { FlightSearchModal } from "./FlightSearchModal"
import { AddFlightModal } from "./AddFlightModal"
import type { GeneratedPlan, FlightReservation, FlightType } from "@/types/plan"

interface FlightsViewProps {
  plan: GeneratedPlan
  onUpdatePlan: (plan: GeneratedPlan) => void
}

export function FlightsView({ plan, onUpdatePlan }: FlightsViewProps) {
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingFlight, setEditingFlight] = useState<FlightReservation | null>(null)

  const flights = plan.flights || []

  // Group flights by type
  const outboundFlights = flights.filter(f => f.type === 'outbound')
  const returnFlights = flights.filter(f => f.type === 'return')
  const connectionFlights = flights.filter(f => f.type === 'connection')

  // Handlers
  const handleAddFlight = (flight: FlightReservation) => {
    const updated = [...flights, flight]
    onUpdatePlan({
      ...plan,
      flights: updated,
    })
    setShowAddModal(false)
    setEditingFlight(null)
  }

  const handleUpdateFlight = (updatedFlight: FlightReservation) => {
    const updated = flights.map(f =>
      f.id === updatedFlight.id ? updatedFlight : f
    )
    onUpdatePlan({
      ...plan,
      flights: updated,
    })
    setShowAddModal(false)
    setEditingFlight(null)
  }

  const handleDeleteFlight = (flightId: string) => {
    if (!confirm("¿Eliminar este vuelo?")) return
    const updated = flights.filter(f => f.id !== flightId)
    onUpdatePlan({
      ...plan,
      flights: updated,
    })
  }

  const handleEditFlight = (flight: FlightReservation) => {
    setEditingFlight(flight)
    setShowAddModal(true)
  }

  const isEmpty = flights.length === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Vuelos
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestiona tus reservaciones de vuelo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSearchModal(true)}>
            <Search className="h-4 w-4 mr-2" />
            Buscar vuelos
          </Button>
          <Button onClick={() => {
            setEditingFlight(null)
            setShowAddModal(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar vuelo
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {!isEmpty && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-500 mb-1">
                <PlaneTakeoff className="h-4 w-4" />
                <span className="text-sm font-medium">Ida</span>
              </div>
              <p className="text-2xl font-bold">{outboundFlights.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="flex items-center justify-center gap-2 text-green-500 mb-1">
                <PlaneLanding className="h-4 w-4" />
                <span className="text-sm font-medium">Regreso</span>
              </div>
              <p className="text-2xl font-bold">{returnFlights.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="flex items-center justify-center gap-2 text-amber-500 mb-1">
                <ArrowLeftRight className="h-4 w-4" />
                <span className="text-sm font-medium">Conexiones</span>
              </div>
              <p className="text-2xl font-bold">{connectionFlights.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Plane className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">Sin vuelos</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Agrega tus reservaciones de vuelo o busca opciones en Skyscanner
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="outline" onClick={() => setShowSearchModal(true)}>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar en Skyscanner
                </Button>
                <Button variant="outline" onClick={() => {
                  setEditingFlight(null)
                  setShowAddModal(true)
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar manualmente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outbound Flights */}
      {outboundFlights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-400">Vuelos de Ida</span>
            <span>({outboundFlights.length})</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {outboundFlights.map((flight) => (
              <FlightCard
                key={flight.id}
                flight={flight}
                onEdit={handleEditFlight}
                onDelete={handleDeleteFlight}
              />
            ))}
          </div>
        </div>
      )}

      {/* Return Flights */}
      {returnFlights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">Vuelos de Regreso</span>
            <span>({returnFlights.length})</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {returnFlights.map((flight) => (
              <FlightCard
                key={flight.id}
                flight={flight}
                onEdit={handleEditFlight}
                onDelete={handleDeleteFlight}
              />
            ))}
          </div>
        </div>
      )}

      {/* Connection Flights */}
      {connectionFlights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <span className="text-amber-600 dark:text-amber-400">Conexiones</span>
            <span>({connectionFlights.length})</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {connectionFlights.map((flight) => (
              <FlightCard
                key={flight.id}
                flight={flight}
                onEdit={handleEditFlight}
                onDelete={handleDeleteFlight}
              />
            ))}
          </div>
        </div>
      )}

      {/* Flight Search Modal */}
      <FlightSearchModal
        open={showSearchModal}
        onOpenChange={setShowSearchModal}
        destination={plan.trip.destination}
        startDate={plan.trip.startDate}
        endDate={plan.trip.endDate}
        travelers={plan.trip.travelers}
      />

      {/* Add/Edit Flight Modal */}
      <AddFlightModal
        open={showAddModal}
        onOpenChange={(open) => {
          setShowAddModal(open)
          if (!open) setEditingFlight(null)
        }}
        flight={editingFlight}
        onSave={editingFlight ? handleUpdateFlight : handleAddFlight}
        tripStartDate={plan.trip.startDate}
        tripEndDate={plan.trip.endDate}
      />
    </div>
  )
}
