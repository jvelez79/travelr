"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, Save } from "lucide-react"
import type { FlightReservation, FlightType } from "@/types/plan"

interface AddFlightModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flight?: FlightReservation | null
  onSave: (flight: FlightReservation) => void
  tripStartDate: string
  tripEndDate: string
}

export function AddFlightModal({
  open,
  onOpenChange,
  flight,
  onSave,
  tripStartDate,
  tripEndDate,
}: AddFlightModalProps) {
  const isEditing = !!flight

  // Form state
  const [type, setType] = useState<FlightType>("outbound")
  const [origin, setOrigin] = useState("")
  const [originCity, setOriginCity] = useState("")
  const [destination, setDestination] = useState("")
  const [destinationCity, setDestinationCity] = useState("")
  const [date, setDate] = useState(tripStartDate)
  const [arrivalDate, setArrivalDate] = useState("")
  const [departureTime, setDepartureTime] = useState("")
  const [arrivalTime, setArrivalTime] = useState("")
  const [airline, setAirline] = useState("")
  const [confirmationNumber, setConfirmationNumber] = useState("")
  const [pricePerPerson, setPricePerPerson] = useState("")
  const [notes, setNotes] = useState("")

  // Reset/populate form when modal opens or flight changes
  useEffect(() => {
    if (open) {
      if (flight) {
        // Editing existing flight
        setType(flight.type || "outbound")
        setOrigin(flight.origin || "")
        setOriginCity(flight.originCity || "")
        setDestination(flight.destination || "")
        setDestinationCity(flight.destinationCity || "")
        setDate(flight.date || tripStartDate)
        setArrivalDate(flight.arrivalDate || "")
        setDepartureTime(flight.departureTime || "")
        setArrivalTime(flight.arrivalTime || "")
        setAirline(flight.airline || "")
        setConfirmationNumber(flight.confirmationNumber || "")
        setPricePerPerson(flight.pricePerPerson?.toString() || "")
        setNotes(flight.notes || "")
      } else {
        // New flight - reset form
        setType("outbound")
        setOrigin("")
        setOriginCity("")
        setDestination("")
        setDestinationCity("")
        setDate(tripStartDate)
        setArrivalDate("")
        setDepartureTime("")
        setArrivalTime("")
        setAirline("")
        setConfirmationNumber("")
        setPricePerPerson("")
        setNotes("")
      }
    }
  }, [open, flight, tripStartDate])

  // Format IATA code input
  const handleIATAInput = (value: string, setter: (val: string) => void) => {
    const formatted = value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3)
    setter(formatted)
  }

  const handleSave = () => {
    // Validate required fields
    if (!origin || !destination || !date || !departureTime || !arrivalTime || !airline) {
      return
    }

    const flightData: FlightReservation = {
      id: flight?.id || `flight-${Date.now()}`,
      type,
      origin: origin.toUpperCase(),
      originCity,
      destination: destination.toUpperCase(),
      destinationCity,
      date,
      arrivalDate: arrivalDate || undefined,
      departureTime,
      arrivalTime,
      airline,
      confirmationNumber: confirmationNumber || undefined,
      pricePerPerson: pricePerPerson ? parseFloat(pricePerPerson) : undefined,
      notes: notes || undefined,
    }

    onSave(flightData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 gap-0 overflow-hidden flex flex-col",
          "w-screen h-auto max-w-none rounded-none",
          "md:w-[600px] md:max-w-[600px] md:rounded-lg"
        )}
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background md:px-6 md:py-4">
          <DialogTitle className="text-lg font-semibold">
            {isEditing ? "Editar vuelo" : "Agregar vuelo"}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Cerrar</span>
          </Button>
        </div>

        {/* Form */}
        <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[70vh] md:px-6 md:py-5">
          {/* Flight Type */}
          <div className="space-y-2">
            <Label htmlFor="flightType" className="text-sm font-medium">
              Tipo de vuelo
            </Label>
            <Select value={type} onValueChange={(v) => setType(v as FlightType)}>
              <SelectTrigger id="flightType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outbound">Ida</SelectItem>
                <SelectItem value="return">Regreso</SelectItem>
                <SelectItem value="connection">Conexión</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Airport Codes and Cities */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="origin" className="text-sm font-medium">
                  Origen (código IATA)
                </Label>
                <Input
                  id="origin"
                  placeholder="SJU"
                  value={origin}
                  onChange={(e) => handleIATAInput(e.target.value, setOrigin)}
                  maxLength={3}
                  className="uppercase font-mono"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="originCity" className="text-sm font-medium">
                  Ciudad de origen
                </Label>
                <Input
                  id="originCity"
                  placeholder="San Juan"
                  value={originCity}
                  onChange={(e) => setOriginCity(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="destination" className="text-sm font-medium">
                  Destino (código IATA)
                </Label>
                <Input
                  id="destination"
                  placeholder="SJO"
                  value={destination}
                  onChange={(e) => handleIATAInput(e.target.value, setDestination)}
                  maxLength={3}
                  className="uppercase font-mono"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destinationCity" className="text-sm font-medium">
                  Ciudad de destino
                </Label>
                <Input
                  id="destinationCity"
                  placeholder="San José"
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">
                Fecha de salida *
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrivalDate" className="text-sm font-medium">
                Fecha de llegada (si diferente)
              </Label>
              <Input
                id="arrivalDate"
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
              />
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="departureTime" className="text-sm font-medium">
                Hora de salida *
              </Label>
              <Input
                id="departureTime"
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrivalTime" className="text-sm font-medium">
                Hora de llegada *
              </Label>
              <Input
                id="arrivalTime"
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Airline */}
          <div className="space-y-2">
            <Label htmlFor="airline" className="text-sm font-medium">
              Aerolínea y número de vuelo *
            </Label>
            <Input
              id="airline"
              placeholder="COPA AIRLINES CM 451"
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
              required
            />
          </div>

          {/* Confirmation and Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="confirmation" className="text-sm font-medium">
                Número de confirmación
              </Label>
              <Input
                id="confirmation"
                placeholder="ABC123"
                value={confirmationNumber}
                onChange={(e) => setConfirmationNumber(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium">
                Precio por persona ($)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="250.00"
                value={pricePerPerson}
                onChange={(e) => setPricePerPerson(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notas
            </Label>
            <textarea
              id="notes"
              placeholder="Notas adicionales sobre el vuelo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-muted/30 md:px-6 md:py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!origin || !destination || !date || !departureTime || !arrivalTime || !airline}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isEditing ? "Guardar cambios" : "Agregar vuelo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
