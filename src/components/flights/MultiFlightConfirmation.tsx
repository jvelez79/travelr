"use client"

import { useState } from "react"
import { Check, AlertTriangle, Edit2, Plane, ArrowRight, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { AirportAutocomplete } from "@/components/shared/AirportAutocomplete"
import type { Airport } from "@/lib/flights/airports"
import type { MultiFlightExtractionResult, ExtractedFlightSegment } from "@/lib/flights/types"
import type { FlightType, FlightReservation } from "@/types/plan"

interface FlightState {
  selected: boolean
  data: ExtractedFlightSegment
  isExpanded: boolean
}

interface MultiFlightConfirmationProps {
  data: MultiFlightExtractionResult
  onConfirm: (flights: FlightReservation[]) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function MultiFlightConfirmation({
  data,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: MultiFlightConfirmationProps) {
  // Initialize flight states
  const [flightStates, setFlightStates] = useState<Record<number, FlightState>>(() =>
    Object.fromEntries(
      data.flights.map((f, i) => [
        i,
        { selected: true, data: { ...f }, isExpanded: false },
      ])
    )
  )

  const confidenceLevel = data.overallConfidence >= 0.8 ? "high" : data.overallConfidence >= 0.5 ? "medium" : "low"
  const confidenceColor = {
    high: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-red-100 text-red-800",
  }[confidenceLevel]

  const selectedCount = Object.values(flightStates).filter((s) => s.selected).length

  const toggleFlightSelection = (index: number) => {
    setFlightStates((prev) => ({
      ...prev,
      [index]: { ...prev[index], selected: !prev[index].selected },
    }))
  }

  const toggleFlightExpanded = (index: number) => {
    setFlightStates((prev) => ({
      ...prev,
      [index]: { ...prev[index], isExpanded: !prev[index].isExpanded },
    }))
  }

  const updateFlightField = (
    index: number,
    field: keyof ExtractedFlightSegment,
    value: string | number | undefined
  ) => {
    setFlightStates((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        data: { ...prev[index].data, [field]: value },
      },
    }))
  }

  const handleAirportChange = (
    index: number,
    field: 'origin' | 'destination',
    iata: string,
    airport?: Airport
  ) => {
    setFlightStates((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        data: {
          ...prev[index].data,
          [field]: iata.toUpperCase(),
          [`${field}City`]: airport?.city || prev[index].data[`${field}City` as keyof ExtractedFlightSegment],
        },
      },
    }))
  }

  const handleConfirm = () => {
    const selectedFlights: FlightReservation[] = Object.entries(flightStates)
      .filter(([_, state]) => state.selected)
      .map(([_, state]) => ({
        id: `flight-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: (state.data.type || 'outbound') as FlightType,
        origin: state.data.origin || '',
        originCity: state.data.originCity || '',
        destination: state.data.destination || '',
        destinationCity: state.data.destinationCity || '',
        date: state.data.date || '',
        arrivalDate: state.data.arrivalDate,
        departureTime: state.data.departureTime || '',
        arrivalTime: state.data.arrivalTime || '',
        airline: state.data.airline || '',
        confirmationNumber: data.sharedData.confirmationNumber,
        pricePerPerson: state.data.pricePerPerson,
        source: 'receipt_upload' as const,
        sourceData: {
          originalFile: 'uploaded',
          extractedAt: new Date().toISOString(),
          confidence: state.data.confidence,
        },
      }))

    onConfirm(selectedFlights)
  }

  const getFlightTypeLabel = (type?: string) => {
    switch (type) {
      case 'outbound':
        return 'Ida'
      case 'return':
        return 'Regreso'
      case 'connection':
        return 'Conexión'
      default:
        return 'Vuelo'
    }
  }

  const getFlightTypeBadgeColor = (type?: string) => {
    switch (type) {
      case 'outbound':
        return 'bg-blue-100 text-blue-800'
      case 'return':
        return 'bg-purple-100 text-purple-800'
      case 'connection':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {data.flights.length} vuelo{data.flights.length !== 1 ? 's' : ''} encontrado{data.flights.length !== 1 ? 's' : ''}
          </h3>
          <p className="text-sm text-muted-foreground">
            Selecciona los vuelos que deseas agregar
          </p>
        </div>
        <Badge className={confidenceColor}>
          {Math.round(data.overallConfidence * 100)}% confianza
        </Badge>
      </div>

      {/* Low confidence warning */}
      {confidenceLevel === "low" && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Baja confianza en la extracción</p>
            <p>Por favor revisa cuidadosamente los datos de cada vuelo.</p>
          </div>
        </div>
      )}

      {/* Shared Data */}
      {(data.sharedData.confirmationNumber || data.sharedData.passengerNames?.length) && (
        <div className="p-3 bg-muted/50 rounded-lg space-y-1">
          {data.sharedData.confirmationNumber && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Confirmación:</span>
              <span className="font-mono font-medium">{data.sharedData.confirmationNumber}</span>
            </div>
          )}
          {data.sharedData.passengerNames && data.sharedData.passengerNames.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Pasajero{data.sharedData.passengerNames.length > 1 ? 's' : ''}:</span>
              <span className="font-medium">{data.sharedData.passengerNames.join(', ')}</span>
            </div>
          )}
          {data.sharedData.totalPrice && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">{data.sharedData.currency || 'USD'} {data.sharedData.totalPrice}</span>
            </div>
          )}
        </div>
      )}

      {/* Flight List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {data.flights.map((flight, index) => {
          const state = flightStates[index]
          if (!state) return null

          return (
            <Collapsible
              key={index}
              open={state.isExpanded}
              onOpenChange={() => toggleFlightExpanded(index)}
            >
              <div
                className={`border rounded-lg transition-colors ${
                  state.selected ? 'border-primary/50 bg-primary/5' : 'border-border bg-background'
                }`}
              >
                {/* Flight Summary Row */}
                <div className="flex items-center gap-3 p-3">
                  <Checkbox
                    checked={state.selected}
                    onCheckedChange={() => toggleFlightSelection(index)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={getFlightTypeBadgeColor(state.data.type)}>
                        {getFlightTypeLabel(state.data.type)}
                      </Badge>
                      <span className="font-medium text-sm">
                        {state.data.origin || '???'} <ArrowRight className="inline h-3 w-3" /> {state.data.destination || '???'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span>{state.data.date || 'Sin fecha'}</span>
                      <span>•</span>
                      <span>{state.data.departureTime || '??:??'} - {state.data.arrivalTime || '??:??'}</span>
                      <span>•</span>
                      <span>{state.data.airline || 'Aerolínea'} {state.data.flightNumber || ''}</span>
                    </div>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {state.isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>

                {/* Expanded Edit Form */}
                <CollapsibleContent>
                  <div className="border-t p-3 space-y-3">
                    {/* Flight Type */}
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo de vuelo</Label>
                      <Select
                        value={state.data.type || 'outbound'}
                        onValueChange={(v) => updateFlightField(index, 'type', v as FlightType)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="outbound">Ida</SelectItem>
                          <SelectItem value="return">Regreso</SelectItem>
                          <SelectItem value="connection">Conexión</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Airline and Flight Number */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Aerolínea</Label>
                        <Input
                          className="h-8 text-sm"
                          value={state.data.airline || ''}
                          onChange={(e) => updateFlightField(index, 'airline', e.target.value)}
                          placeholder="COPA Airlines"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Número de vuelo</Label>
                        <Input
                          className="h-8 text-sm font-mono"
                          value={state.data.flightNumber || ''}
                          onChange={(e) => updateFlightField(index, 'flightNumber', e.target.value)}
                          placeholder="451"
                        />
                      </div>
                    </div>

                    {/* Origin and Destination */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Origen</Label>
                        <AirportAutocomplete
                          value={state.data.origin || ''}
                          onChange={(iata, airport) => handleAirportChange(index, 'origin', iata, airport)}
                          placeholder="SJU"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Destino</Label>
                        <AirportAutocomplete
                          value={state.data.destination || ''}
                          onChange={(iata, airport) => handleAirportChange(index, 'destination', iata, airport)}
                          placeholder="PTY"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    {/* Date and Times */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Fecha</Label>
                        <Input
                          type="date"
                          className="h-8 text-sm"
                          value={state.data.date || ''}
                          onChange={(e) => updateFlightField(index, 'date', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Salida</Label>
                        <Input
                          className="h-8 text-sm"
                          value={state.data.departureTime || ''}
                          onChange={(e) => updateFlightField(index, 'departureTime', e.target.value)}
                          placeholder="5:27 AM"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Llegada</Label>
                        <Input
                          className="h-8 text-sm"
                          value={state.data.arrivalTime || ''}
                          onChange={(e) => updateFlightField(index, 'arrivalTime', e.target.value)}
                          placeholder="7:30 AM"
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          {selectedCount} de {data.flights.length} seleccionado{selectedCount !== 1 ? 's' : ''}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || selectedCount === 0}
          >
            {isSubmitting ? (
              "Guardando..."
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Agregar {selectedCount} vuelo{selectedCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
