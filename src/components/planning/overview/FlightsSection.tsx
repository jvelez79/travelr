"use client"

import { useState, useMemo } from "react"
import { Plus, Plane, PlaneTakeoff, PlaneLanding, ArrowLeftRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FlightCard } from "./FlightCard"
import { FlightSearchModal } from "@/components/flights"
import type { FlightReservation, FlightType } from "@/types/plan"

interface FlightsSectionProps {
  flights: FlightReservation[]
  tripStartDate?: string
  tripEndDate?: string
  tripDestination?: string
  tripTravelers?: number
  onAddFlight: (flight: FlightReservation) => void
  onUpdateFlight?: (id: string, flight: Partial<FlightReservation>) => void
  onDeleteFlight: (id: string) => void
}

const FLIGHT_TYPE_LABELS: Record<FlightType, string> = {
  outbound: "Ida",
  return: "Regreso",
  connection: "Conexion",
}

const FLIGHT_TYPE_ICONS: Record<FlightType, typeof PlaneTakeoff> = {
  outbound: PlaneTakeoff,
  return: PlaneLanding,
  connection: ArrowLeftRight,
}

const initialFormData = {
  type: "outbound" as FlightType,
  origin: "",
  originCity: "",
  destination: "",
  destinationCity: "",
  date: "",
  arrivalDate: "",
  departureTime: "",
  arrivalTime: "",
  airline: "",
  confirmationNumber: "",
  notes: "",
  pricePerPerson: "",
}

export function FlightsSection({
  flights,
  tripStartDate,
  tripEndDate,
  tripDestination,
  tripTravelers,
  onAddFlight,
  onUpdateFlight,
  onDeleteFlight,
}: FlightsSectionProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [editingFlight, setEditingFlight] = useState<FlightReservation | null>(null)
  const [formData, setFormData] = useState(initialFormData)

  // Sort flights by date
  const sortedFlights = useMemo(() => {
    return [...flights].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateA - dateB
    })
  }, [flights])

  // Group flights by type for display
  const flightsByType = useMemo(() => {
    const outbound = sortedFlights.filter(f => f.type === "outbound")
    const returnFlights = sortedFlights.filter(f => f.type === "return")
    const connections = sortedFlights.filter(f => f.type === "connection")
    // Include flights without type (legacy) as outbound
    const legacy = sortedFlights.filter(f => !f.type)
    return {
      outbound: [...outbound, ...legacy],
      return: returnFlights,
      connection: connections,
    }
  }, [sortedFlights])

  const resetForm = () => {
    setFormData(initialFormData)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newFlight: FlightReservation = {
      id: `flight-${Date.now()}`,
      type: formData.type,
      origin: formData.origin.toUpperCase(),
      originCity: formData.originCity,
      destination: formData.destination.toUpperCase(),
      destinationCity: formData.destinationCity,
      date: formData.date,
      arrivalDate: formData.arrivalDate || undefined,
      departureTime: formData.departureTime,
      arrivalTime: formData.arrivalTime,
      airline: formData.airline.toUpperCase(),
      confirmationNumber: formData.confirmationNumber || undefined,
      notes: formData.notes || undefined,
      pricePerPerson: formData.pricePerPerson ? parseFloat(formData.pricePerPerson) : undefined,
    }

    onAddFlight(newFlight)
    resetForm()
    setIsAddOpen(false)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingFlight || !onUpdateFlight) return

    onUpdateFlight(editingFlight.id, {
      type: formData.type,
      origin: formData.origin.toUpperCase(),
      originCity: formData.originCity,
      destination: formData.destination.toUpperCase(),
      destinationCity: formData.destinationCity,
      date: formData.date,
      arrivalDate: formData.arrivalDate || undefined,
      departureTime: formData.departureTime,
      arrivalTime: formData.arrivalTime,
      airline: formData.airline.toUpperCase(),
      confirmationNumber: formData.confirmationNumber || undefined,
      notes: formData.notes || undefined,
      pricePerPerson: formData.pricePerPerson ? parseFloat(formData.pricePerPerson) : undefined,
    })

    setEditingFlight(null)
    resetForm()
    setIsEditOpen(false)
  }

  const handleEdit = (flight: FlightReservation) => {
    setEditingFlight(flight)
    setFormData({
      type: flight.type || "outbound",
      origin: flight.origin,
      originCity: flight.originCity,
      destination: flight.destination,
      destinationCity: flight.destinationCity,
      date: flight.date,
      arrivalDate: flight.arrivalDate || "",
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      airline: flight.airline,
      confirmationNumber: flight.confirmationNumber || "",
      notes: flight.notes || "",
      pricePerPerson: flight.pricePerPerson?.toString() || "",
    })
    setIsEditOpen(true)
  }

  const isDateOutOfRange = (date: string) => {
    if (!tripStartDate || !tripEndDate || !date) return false
    const flightDate = new Date(date)
    const start = new Date(tripStartDate)
    const end = new Date(tripEndDate)
    return flightDate < start || flightDate > end
  }

  const FlightForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void, submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      {/* Flight Type Selector */}
      <div className="space-y-2">
        <Label htmlFor="type">Tipo de vuelo</Label>
        <Select
          value={formData.type}
          onValueChange={(value: FlightType) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona tipo de vuelo" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(FLIGHT_TYPE_LABELS) as FlightType[]).map((type) => {
              const Icon = FLIGHT_TYPE_ICONS[type]
              return (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {FLIGHT_TYPE_LABELS[type]}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="origin">Codigo origen</Label>
          <Input
            id="origin"
            placeholder="SJU"
            maxLength={4}
            value={formData.origin}
            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="originCity">Ciudad origen</Label>
          <Input
            id="originCity"
            placeholder="San Juan"
            value={formData.originCity}
            onChange={(e) => setFormData({ ...formData, originCity: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="destination">Codigo destino</Label>
          <Input
            id="destination"
            placeholder="PTY"
            maxLength={4}
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="destinationCity">Ciudad destino</Label>
          <Input
            id="destinationCity"
            placeholder="Panama City"
            value={formData.destinationCity}
            onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Fecha salida</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            min={tripStartDate}
            max={tripEndDate}
            required
          />
          {isDateOutOfRange(formData.date) && (
            <p className="text-xs text-amber-600">Fecha fuera del rango del viaje</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="arrivalDate">Fecha llegada (si diferente)</Label>
          <Input
            id="arrivalDate"
            type="date"
            value={formData.arrivalDate}
            onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
            min={formData.date || tripStartDate}
            max={tripEndDate}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="departureTime">Hora salida</Label>
          <Input
            id="departureTime"
            type="time"
            value={formData.departureTime}
            onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="arrivalTime">Hora llegada</Label>
          <Input
            id="arrivalTime"
            type="time"
            value={formData.arrivalTime}
            onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="airline">Aerolinea y numero de vuelo</Label>
        <Input
          id="airline"
          placeholder="Copa Airlines CM 451"
          value={formData.airline}
          onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="confirmationNumber">Codigo confirmacion</Label>
          <Input
            id="confirmationNumber"
            placeholder="ABC123"
            value={formData.confirmationNumber}
            onChange={(e) => setFormData({ ...formData, confirmationNumber: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pricePerPerson">Precio por persona</Label>
          <Input
            id="pricePerPerson"
            type="number"
            step="0.01"
            placeholder="250.00"
            value={formData.pricePerPerson}
            onChange={(e) => setFormData({ ...formData, pricePerPerson: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Input
          id="notes"
          placeholder="Terminal 2, asiento ventana..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            resetForm()
            setIsAddOpen(false)
            setIsEditOpen(false)
            setEditingFlight(null)
          }}
        >
          Cancelar
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )

  return (
    <section id="flights" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Vuelos</h3>
          {flights.length > 0 && (
            <span className="text-sm text-muted-foreground">({flights.length})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="w-4 h-4 mr-1" />
            Buscar vuelos
          </Button>
          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Agregar vuelo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar vuelo</DialogTitle>
              </DialogHeader>
              <FlightForm onSubmit={handleAddSubmit} submitLabel="Agregar" />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {flights.length === 0 ? (
        <div className="bg-muted/30 rounded-xl border border-dashed border-border p-8 text-center">
          <Plane className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No hay vuelos agregados</p>
          <p className="text-sm text-muted-foreground mt-1">
            Agrega tus vuelos para tener toda la informacion en un solo lugar
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Outbound flights */}
          {flightsByType.outbound.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PlaneTakeoff className="w-4 h-4" />
                <span>Vuelos de ida</span>
              </div>
              <div className="space-y-3">
                {flightsByType.outbound.map((flight) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    onEdit={onUpdateFlight ? handleEdit : undefined}
                    onDelete={onDeleteFlight}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Connection flights */}
          {flightsByType.connection.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowLeftRight className="w-4 h-4" />
                <span>Conexiones</span>
              </div>
              <div className="space-y-3">
                {flightsByType.connection.map((flight) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    onEdit={onUpdateFlight ? handleEdit : undefined}
                    onDelete={onDeleteFlight}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Return flights */}
          {flightsByType.return.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PlaneLanding className="w-4 h-4" />
                <span>Vuelos de regreso</span>
              </div>
              <div className="space-y-3">
                {flightsByType.return.map((flight) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    onEdit={onUpdateFlight ? handleEdit : undefined}
                    onDelete={onDeleteFlight}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open)
        if (!open) {
          resetForm()
          setEditingFlight(null)
        }
      }}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar vuelo</DialogTitle>
          </DialogHeader>
          <FlightForm onSubmit={handleEditSubmit} submitLabel="Guardar cambios" />
        </DialogContent>
      </Dialog>

      {/* Flight Search Modal */}
      <FlightSearchModal
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        destination={tripDestination || ""}
        startDate={tripStartDate || ""}
        endDate={tripEndDate || ""}
        travelers={tripTravelers || 1}
      />
    </section>
  )
}
