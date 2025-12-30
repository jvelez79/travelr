"use client"

import { useState } from "react"
import { Plus, Plane, Search, PlaneTakeoff, PlaneLanding, ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FlightCard } from "@/components/planning/overview/FlightCard"
import { FlightSearchModal } from "./FlightSearchModal"
import { AddFlightModal } from "./AddFlightModal"
import type { GeneratedPlan, FlightReservation, FlightType } from "@/types/plan"

// Types for journey grouping
interface FlightJourney {
  type: 'outbound' | 'return'
  mainFlight: FlightReservation
  connections: FlightReservation[]
}

interface GroupedFlights {
  outboundJourneys: FlightJourney[]
  returnJourneys: FlightJourney[]
  orphanConnections: FlightReservation[]
}

// Helper: Check if two dates are within 1 day of each other
function isDateClose(date1: string, date2: string): boolean {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffDays = Math.abs((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays <= 1
}

// Group flights into journeys with their connections
function groupFlightsIntoJourneys(flights: FlightReservation[]): GroupedFlights {
  const outboundFlights = flights.filter(f => f.type === 'outbound')
  const returnFlights = flights.filter(f => f.type === 'return')
  const connectionFlights = flights.filter(f => f.type === 'connection')

  const outboundJourneys: FlightJourney[] = []
  const returnJourneys: FlightJourney[] = []
  const usedConnections = new Set<string>()

  // Process outbound flights
  for (const outbound of outboundFlights) {
    const journey: FlightJourney = {
      type: 'outbound',
      mainFlight: outbound,
      connections: []
    }

    // Find connection chain: where connection.origin === last.destination
    let lastDestination = outbound.destination
    let lastDate = outbound.arrivalDate || outbound.date

    let foundMore = true
    while (foundMore) {
      foundMore = false
      for (const conn of connectionFlights) {
        if (usedConnections.has(conn.id)) continue

        if (conn.origin === lastDestination && isDateClose(conn.date, lastDate)) {
          journey.connections.push(conn)
          usedConnections.add(conn.id)
          lastDestination = conn.destination
          lastDate = conn.arrivalDate || conn.date
          foundMore = true
          break
        }
      }
    }

    outboundJourneys.push(journey)
  }

  // Process return flights
  for (const returnFlight of returnFlights) {
    const journey: FlightJourney = {
      type: 'return',
      mainFlight: returnFlight,
      connections: []
    }

    let lastDestination = returnFlight.destination
    let lastDate = returnFlight.arrivalDate || returnFlight.date

    let foundMore = true
    while (foundMore) {
      foundMore = false
      for (const conn of connectionFlights) {
        if (usedConnections.has(conn.id)) continue

        if (conn.origin === lastDestination && isDateClose(conn.date, lastDate)) {
          journey.connections.push(conn)
          usedConnections.add(conn.id)
          lastDestination = conn.destination
          lastDate = conn.arrivalDate || conn.date
          foundMore = true
          break
        }
      }
    }

    returnJourneys.push(journey)
  }

  // Orphan connections that didn't match any journey
  const orphanConnections = connectionFlights.filter(c => !usedConnections.has(c.id))

  return { outboundJourneys, returnJourneys, orphanConnections }
}

interface FlightsViewProps {
  plan: GeneratedPlan
  onUpdatePlan: (plan: GeneratedPlan) => void
}

export function FlightsView({ plan, onUpdatePlan }: FlightsViewProps) {
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingFlight, setEditingFlight] = useState<FlightReservation | null>(null)

  const flights = plan.flights || []

  // Group flights into journeys (main flights + their connections)
  const { outboundJourneys, returnJourneys, orphanConnections } = groupFlightsIntoJourneys(flights)

  // Handlers
  const handleAddFlights = (flightsToAdd: FlightReservation | FlightReservation[]) => {
    const newFlights = Array.isArray(flightsToAdd) ? flightsToAdd : [flightsToAdd]
    const updated = [...flights, ...newFlights]
    onUpdatePlan({
      ...plan,
      flights: updated,
    })
    setShowAddModal(false)
    setEditingFlight(null)
  }

  const handleUpdateFlight = (updatedFlight: FlightReservation | FlightReservation[]) => {
    // For updates, we only handle single flight
    const flightToUpdate = Array.isArray(updatedFlight) ? updatedFlight[0] : updatedFlight
    if (!flightToUpdate) return
    const updated = flights.map(f =>
      f.id === flightToUpdate.id ? flightToUpdate : f
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold flex items-center gap-2">
            <Plane className="h-6 w-6" />
            Vuelos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
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

      {/* Empty State */}
      {isEmpty && (
        <Card className="border-dashed">
          <CardContent className="py-16">
            <div className="text-center max-w-md mx-auto space-y-6">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Plane className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Agrega tus vuelos</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Busca opciones en Skyscanner o agrega tus confirmaciones de vuelo manualmente para tener todo organizado en un solo lugar
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={() => setShowSearchModal(true)}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar vuelos en Skyscanner
                </Button>
                <div className="text-center">
                  <button
                    onClick={() => {
                      setEditingFlight(null)
                      setShowAddModal(true)
                    }}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    o agregar confirmación manualmente
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outbound Journeys */}
      {outboundJourneys.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <PlaneTakeoff className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Viajes de Ida
            </span>
            <span className="text-sm text-muted-foreground">
              ({outboundJourneys.length} {outboundJourneys.length === 1 ? 'viaje' : 'viajes'})
            </span>
          </div>
          <div className="space-y-6">
            {outboundJourneys.map((journey) => (
              <div key={journey.mainFlight.id} className="space-y-0">
                {/* Main flight */}
                <FlightCard
                  flight={journey.mainFlight}
                  onEdit={handleEditFlight}
                  onDelete={handleDeleteFlight}
                />
                {/* Connections */}
                {journey.connections.map((conn) => (
                  <div key={conn.id} className="relative pl-6 pt-3">
                    {/* Visual connection indicator */}
                    <div className="absolute left-2 -top-1 bottom-4 w-px bg-amber-400/50" />
                    <div className="absolute left-0.5 top-6 w-3 h-3 rounded-full border-2 border-amber-400 bg-background" />
                    <FlightCard
                      flight={conn}
                      onEdit={handleEditFlight}
                      onDelete={handleDeleteFlight}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Return Journeys */}
      {returnJourneys.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <PlaneLanding className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Viajes de Regreso
            </span>
            <span className="text-sm text-muted-foreground">
              ({returnJourneys.length} {returnJourneys.length === 1 ? 'viaje' : 'viajes'})
            </span>
          </div>
          <div className="space-y-6">
            {returnJourneys.map((journey) => (
              <div key={journey.mainFlight.id} className="space-y-0">
                {/* Main flight */}
                <FlightCard
                  flight={journey.mainFlight}
                  onEdit={handleEditFlight}
                  onDelete={handleDeleteFlight}
                />
                {/* Connections */}
                {journey.connections.map((conn) => (
                  <div key={conn.id} className="relative pl-6 pt-3">
                    {/* Visual connection indicator */}
                    <div className="absolute left-2 -top-1 bottom-4 w-px bg-amber-400/50" />
                    <div className="absolute left-0.5 top-6 w-3 h-3 rounded-full border-2 border-amber-400 bg-background" />
                    <FlightCard
                      flight={conn}
                      onEdit={handleEditFlight}
                      onDelete={handleDeleteFlight}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orphan Connections (if any didn't match) */}
      {orphanConnections.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Conexiones sin asignar
            </span>
            <span className="text-sm text-muted-foreground">({orphanConnections.length})</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {orphanConnections.map((flight) => (
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
        tripOrigin={plan.trip.origin}
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
        onSave={editingFlight ? handleUpdateFlight : handleAddFlights}
        tripId={plan.id}
        tripStartDate={plan.trip.startDate}
        tripEndDate={plan.trip.endDate}
        onOpenFlightSearch={() => {
          setShowAddModal(false)
          setShowSearchModal(true)
        }}
      />
    </div>
  )
}
