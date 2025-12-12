"use client"

import { useState } from "react"
import { Plus, Plane } from "lucide-react"
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
import { FlightCard } from "./FlightCard"
import type { FlightReservation } from "@/types/plan"

interface FlightsSectionProps {
  flights: FlightReservation[]
  onAddFlight: (flight: FlightReservation) => void
  onUpdateFlight?: (id: string, flight: Partial<FlightReservation>) => void
  onDeleteFlight: (id: string) => void
}

export function FlightsSection({ flights, onAddFlight, onDeleteFlight }: FlightsSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    origin: "",
    originCity: "",
    destination: "",
    destinationCity: "",
    date: "",
    departureTime: "",
    arrivalTime: "",
    airline: "",
    confirmationNumber: "",
    notes: "",
    pricePerPerson: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newFlight: FlightReservation = {
      id: `flight-${Date.now()}`,
      origin: formData.origin.toUpperCase(),
      originCity: formData.originCity,
      destination: formData.destination.toUpperCase(),
      destinationCity: formData.destinationCity,
      date: formData.date,
      departureTime: formData.departureTime,
      arrivalTime: formData.arrivalTime,
      airline: formData.airline.toUpperCase(),
      confirmationNumber: formData.confirmationNumber || undefined,
      notes: formData.notes || undefined,
      pricePerPerson: formData.pricePerPerson ? parseFloat(formData.pricePerPerson) : undefined,
    }

    onAddFlight(newFlight)
    setFormData({
      origin: "",
      originCity: "",
      destination: "",
      destinationCity: "",
      date: "",
      departureTime: "",
      arrivalTime: "",
      airline: "",
      confirmationNumber: "",
      notes: "",
      pricePerPerson: "",
    })
    setIsOpen(false)
  }

  return (
    <section id="flights" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Vuelos</h3>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Agregar vuelo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Agregar vuelo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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

              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departureTime">Hora salida</Label>
                  <Input
                    id="departureTime"
                    placeholder="5:27 AM"
                    value={formData.departureTime}
                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrivalTime">Hora llegada</Label>
                  <Input
                    id="arrivalTime"
                    placeholder="7:30 AM"
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="airline">Aerolinea</Label>
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
                  <Label htmlFor="confirmationNumber">Confirmacion</Label>
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
                  placeholder="Para Juan Martinez"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Agregar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
        <div className="space-y-3">
          {flights.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              onDelete={onDeleteFlight}
            />
          ))}
        </div>
      )}
    </section>
  )
}
