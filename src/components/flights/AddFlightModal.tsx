"use client"

import { useState, useEffect, useCallback } from "react"
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
import { X, Save, Search, Upload, Mail, ArrowLeft } from "lucide-react"
import { AirportAutocomplete } from "@/components/shared/AirportAutocomplete"
import { ReceiptUploader } from "@/components/shared/ReceiptUploader"
import { ExtractedFlightDataConfirmation } from "./ExtractedFlightDataConfirmation"
import { MultiFlightConfirmation } from "./MultiFlightConfirmation"
import { FlightEmailForwardInstructions } from "./FlightEmailForwardInstructions"
import { findAirportByIATA, type Airport } from "@/lib/flights/airports"
import type { FlightReservation, FlightType } from "@/types/plan"
import type { ExtractedFlightData, MultiFlightExtractionResult } from "@/lib/flights/types"

type ModalStep = "select" | "upload" | "confirm" | "multi-confirm" | "email" | "search" | "manual"

interface AddFlightModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  flight?: FlightReservation | null
  onSave: (flights: FlightReservation | FlightReservation[]) => void
  tripId: string
  tripStartDate: string
  tripEndDate: string
  onOpenFlightSearch?: () => void
}

export function AddFlightModal({
  open,
  onOpenChange,
  flight,
  onSave,
  tripId,
  tripStartDate,
  tripEndDate,
  onOpenFlightSearch,
}: AddFlightModalProps) {
  const isEditing = !!flight

  // Multi-step modal state
  const [step, setStep] = useState<ModalStep>(isEditing ? "manual" : "select")
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedFlightData | null>(null)
  const [multiFlightData, setMultiFlightData] = useState<MultiFlightExtractionResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // Reset state when modal opens/closes
  const resetState = useCallback(() => {
    setStep(isEditing ? "manual" : "select")
    setIsProcessing(false)
    setExtractError(null)
    setExtractedData(null)
    setMultiFlightData(null)
    setIsSubmitting(false)
  }, [isEditing])

  const handleClose = useCallback(() => {
    resetState()
    onOpenChange(false)
  }, [onOpenChange, resetState])

  // Reset/populate form when modal opens or flight changes
  useEffect(() => {
    if (open) {
      if (flight) {
        // Editing existing flight
        setStep("manual")
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
        setStep("select")
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
      resetState()
    }
  }, [open, flight, tripStartDate, resetState])

  // Handle file upload and extraction
  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true)
    setExtractError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("tripId", tripId)

      const response = await fetch("/api/flights/extract", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to extract data")
      }

      // Check if multi-flight result (new format)
      const extractionResult = result.data as MultiFlightExtractionResult

      if (extractionResult.flights && extractionResult.flights.length > 1) {
        // Multiple flights - use multi-confirm step
        setMultiFlightData(extractionResult)
        setStep("multi-confirm")
      } else if (extractionResult.flights && extractionResult.flights.length === 1) {
        // Single flight from new format - convert to ExtractedFlightData for compatibility
        const flight = extractionResult.flights[0]
        const singleFlightData: ExtractedFlightData = {
          airline: flight.airline,
          flightNumber: flight.flightNumber,
          origin: flight.origin,
          originCity: flight.originCity,
          destination: flight.destination,
          destinationCity: flight.destinationCity,
          date: flight.date,
          arrivalDate: flight.arrivalDate,
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime,
          seatNumber: flight.seatNumber,
          type: flight.type,
          pricePerPerson: flight.pricePerPerson,
          confirmationNumber: extractionResult.sharedData.confirmationNumber,
          passengerNames: extractionResult.sharedData.passengerNames,
          totalPrice: extractionResult.sharedData.totalPrice,
          currency: extractionResult.sharedData.currency,
          confidence: flight.confidence,
        }
        setExtractedData(singleFlightData)
        setStep("confirm")
      } else {
        throw new Error("No se encontraron vuelos en el documento")
      }
    } catch (error) {
      console.error("Extract error:", error)
      setExtractError(error instanceof Error ? error.message : "Error al procesar el archivo")
    } finally {
      setIsProcessing(false)
    }
  }, [tripId])

  // Handle confirmation of extracted data
  const handleConfirmData = useCallback(async (data: ExtractedFlightData) => {
    setIsSubmitting(true)

    try {
      const flightData: FlightReservation = {
        id: flight?.id || `flight-${Date.now()}`,
        type: data.type || "outbound",
        origin: data.origin?.toUpperCase() || "",
        originCity: data.originCity || "",
        destination: data.destination?.toUpperCase() || "",
        destinationCity: data.destinationCity || "",
        date: data.date || "",
        arrivalDate: data.arrivalDate,
        departureTime: data.departureTime || "",
        arrivalTime: data.arrivalTime || "",
        airline: data.airline || "",
        confirmationNumber: data.confirmationNumber,
        pricePerPerson: data.pricePerPerson,
        source: "receipt_upload",
        sourceData: {
          originalFile: "uploaded",
          extractedAt: new Date().toISOString(),
          confidence: data.confidence,
        },
      }

      onSave(flightData)
      handleClose()
    } catch (error) {
      console.error("Error creating flight:", error)
      setExtractError("Error al crear el vuelo")
    } finally {
      setIsSubmitting(false)
    }
  }, [flight?.id, onSave, handleClose])

  // Handle confirmation of multiple flights
  const handleMultiFlightConfirm = useCallback((flights: FlightReservation[]) => {
    setIsSubmitting(true)
    try {
      onSave(flights)
      handleClose()
    } catch (error) {
      console.error("Error creating flights:", error)
      setExtractError("Error al crear los vuelos")
    } finally {
      setIsSubmitting(false)
    }
  }, [onSave, handleClose])

  const handleFlightSearch = useCallback(() => {
    handleClose()
    onOpenFlightSearch?.()
  }, [handleClose, onOpenFlightSearch])

  // Handle origin airport selection
  const handleOriginChange = (iata: string, airport?: Airport) => {
    setOrigin(iata)
    if (airport) {
      setOriginCity(airport.city)
    }
  }

  // Handle destination airport selection
  const handleDestinationChange = (iata: string, airport?: Airport) => {
    setDestination(iata)
    if (airport) {
      setDestinationCity(airport.city)
    }
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
    <Dialog open={open} onOpenChange={handleClose}>
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
          <div className="flex items-center gap-2">
            {step !== "select" && !isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (step === "confirm" || step === "multi-confirm") {
                    setStep("upload")
                    setExtractedData(null)
                    setMultiFlightData(null)
                  } else {
                    setStep("select")
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-lg font-semibold">
              {step === "select" && "Agregar Vuelo"}
              {step === "upload" && "Subir Confirmación"}
              {step === "confirm" && "Confirmar Datos"}
              {step === "multi-confirm" && "Confirmar Vuelos"}
              {step === "email" && "Forward de Email"}
              {step === "manual" && (isEditing ? "Editar vuelo" : "Agregar manualmente")}
            </DialogTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Cerrar</span>
          </Button>
        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[70vh] md:px-6 md:py-5">
          {/* Step: Select Method */}
          {step === "select" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Elige cómo quieres agregar tu vuelo:
              </p>

              {onOpenFlightSearch && (
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  onClick={handleFlightSearch}
                >
                  <Search className="h-5 w-5 mr-3 shrink-0" />
                  <div className="text-left">
                    <p className="font-medium">Buscar vuelos</p>
                    <p className="text-xs text-muted-foreground">
                      Encuentra y compara precios en tiempo real
                    </p>
                  </div>
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
                onClick={() => setStep("upload")}
              >
                <Upload className="h-5 w-5 mr-3 shrink-0" />
                <div className="text-left">
                  <p className="font-medium">Subir recibo/PDF</p>
                  <p className="text-xs text-muted-foreground">
                    Sube tu confirmación y extraemos la info con AI
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
                onClick={() => setStep("email")}
              >
                <Mail className="h-5 w-5 mr-3 shrink-0" />
                <div className="text-left">
                  <p className="font-medium">Forward de email</p>
                  <p className="text-xs text-muted-foreground">
                    Reenvía tu confirmación a nuestra dirección
                  </p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
                onClick={() => setStep("manual")}
              >
                <Save className="h-5 w-5 mr-3 shrink-0" />
                <div className="text-left">
                  <p className="font-medium">Entrada manual</p>
                  <p className="text-xs text-muted-foreground">
                    Ingresa los datos del vuelo manualmente
                  </p>
                </div>
              </Button>
            </div>
          )}

          {/* Step: Upload Receipt */}
          {step === "upload" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sube tu confirmación de vuelo (PDF o imagen) y extraeremos
                automáticamente toda la información.
              </p>

              <ReceiptUploader
                onFileSelect={handleFileSelect}
                isProcessing={isProcessing}
                error={extractError}
              />

              <p className="text-xs text-muted-foreground text-center">
                Funciona con confirmaciones de todas las aerolíneas
              </p>
            </div>
          )}

          {/* Step: Confirm Extracted Data (single flight) */}
          {step === "confirm" && extractedData && (
            <ExtractedFlightDataConfirmation
              data={extractedData}
              onConfirm={handleConfirmData}
              onCancel={() => {
                setStep("upload")
                setExtractedData(null)
              }}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Step: Confirm Multiple Flights */}
          {step === "multi-confirm" && multiFlightData && (
            <MultiFlightConfirmation
              data={multiFlightData}
              onConfirm={handleMultiFlightConfirm}
              onCancel={() => {
                setStep("upload")
                setMultiFlightData(null)
              }}
              isSubmitting={isSubmitting}
            />
          )}

          {/* Step: Email Forward Instructions */}
          {step === "email" && (
            <FlightEmailForwardInstructions tripId={tripId} />
          )}

          {/* Step: Manual Entry */}
          {step === "manual" && (
            <>
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

          {/* Airport Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin" className="text-sm font-medium">
                Origen *
              </Label>
              <AirportAutocomplete
                id="origin"
                value={origin}
                onChange={handleOriginChange}
                placeholder="Buscar aeropuerto..."
                required
              />
              {originCity && (
                <p className="text-xs text-muted-foreground">{originCity}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination" className="text-sm font-medium">
                Destino *
              </Label>
              <AirportAutocomplete
                id="destination"
                value={destination}
                onChange={handleDestinationChange}
                placeholder="Buscar aeropuerto..."
                required
              />
              {destinationCity && (
                <p className="text-xs text-muted-foreground">{destinationCity}</p>
              )}
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
              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleClose}>
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
