"use client"

import { useState } from "react"
import { Check, AlertTriangle, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AirportAutocomplete } from "@/components/shared/AirportAutocomplete"
import { findAirportByIATA, type Airport } from "@/lib/flights/airports"
import type { ExtractedFlightData } from "@/lib/flights/types"
import type { FlightType } from "@/types/plan"

interface ExtractedFlightDataConfirmationProps {
  data: ExtractedFlightData
  onConfirm: (data: ExtractedFlightData) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function ExtractedFlightDataConfirmation({
  data,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: ExtractedFlightDataConfirmationProps) {
  const [editedData, setEditedData] = useState<ExtractedFlightData>(data)
  const [isEditing, setIsEditing] = useState(false)

  const confidenceLevel = data.confidence >= 0.8 ? "high" : data.confidence >= 0.5 ? "medium" : "low"
  const confidenceColor = {
    high: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-red-100 text-red-800",
  }[confidenceLevel]

  const handleFieldChange = (field: keyof ExtractedFlightData, value: string | number | undefined) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAirportChange = (field: 'origin' | 'destination', iata: string, airport?: Airport) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: iata.toUpperCase(),
      [`${field}City`]: airport?.city || prev[`${field}City`],
    }))
  }

  const handleSubmit = () => {
    onConfirm(editedData)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Confirmar datos extraídos</h3>
          <p className="text-sm text-muted-foreground">
            Revisa la información y corrige si es necesario
          </p>
        </div>
        <Badge className={confidenceColor}>
          {Math.round(data.confidence * 100)}% confianza
        </Badge>
      </div>

      {/* Low confidence warning */}
      {confidenceLevel === "low" && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Baja confianza en la extracción</p>
            <p>Por favor revisa cuidadosamente todos los campos antes de confirmar.</p>
          </div>
        </div>
      )}

      {/* Data Fields */}
      <div className="space-y-4">
        {/* Flight Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Tipo de vuelo</Label>
          {isEditing ? (
            <Select
              value={editedData.type || "outbound"}
              onValueChange={(v) => handleFieldChange("type", v as FlightType)}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outbound">Ida</SelectItem>
                <SelectItem value="return">Regreso</SelectItem>
                <SelectItem value="connection">Conexión</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm font-medium p-2 bg-muted rounded">
              {editedData.type === "outbound" ? "Ida" : editedData.type === "return" ? "Regreso" : "Conexión"}
            </p>
          )}
        </div>

        {/* Airline and Flight Number */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="airline">Aerolínea</Label>
            {isEditing ? (
              <Input
                id="airline"
                value={editedData.airline || ""}
                onChange={(e) => handleFieldChange("airline", e.target.value)}
                placeholder="COPA Airlines"
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded">
                {editedData.airline || "—"}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="flightNumber">Número de vuelo</Label>
            {isEditing ? (
              <Input
                id="flightNumber"
                value={editedData.flightNumber || ""}
                onChange={(e) => handleFieldChange("flightNumber", e.target.value)}
                placeholder="451"
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded font-mono">
                {editedData.flightNumber || "—"}
              </p>
            )}
          </div>
        </div>

        {/* Origin and Destination */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="origin">Origen</Label>
            {isEditing ? (
              <AirportAutocomplete
                id="origin"
                value={editedData.origin || ""}
                onChange={(iata, airport) => handleAirportChange('origin', iata, airport)}
                placeholder="Buscar aeropuerto..."
              />
            ) : (
              <div>
                <p className="text-sm font-medium p-2 bg-muted rounded font-mono">
                  {editedData.origin || "—"}
                </p>
                {editedData.originCity && (
                  <p className="text-xs text-muted-foreground mt-1">{editedData.originCity}</p>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination">Destino</Label>
            {isEditing ? (
              <AirportAutocomplete
                id="destination"
                value={editedData.destination || ""}
                onChange={(iata, airport) => handleAirportChange('destination', iata, airport)}
                placeholder="Buscar aeropuerto..."
              />
            ) : (
              <div>
                <p className="text-sm font-medium p-2 bg-muted rounded font-mono">
                  {editedData.destination || "—"}
                </p>
                {editedData.destinationCity && (
                  <p className="text-xs text-muted-foreground mt-1">{editedData.destinationCity}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Fecha de salida</Label>
            {isEditing ? (
              <Input
                id="date"
                type="date"
                value={editedData.date || ""}
                onChange={(e) => handleFieldChange("date", e.target.value)}
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded">
                {editedData.date || "—"}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="arrivalDate">Fecha de llegada (si diferente)</Label>
            {isEditing ? (
              <Input
                id="arrivalDate"
                type="date"
                value={editedData.arrivalDate || ""}
                onChange={(e) => handleFieldChange("arrivalDate", e.target.value)}
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded">
                {editedData.arrivalDate || "—"}
              </p>
            )}
          </div>
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="departureTime">Hora de salida</Label>
            {isEditing ? (
              <Input
                id="departureTime"
                value={editedData.departureTime || ""}
                onChange={(e) => handleFieldChange("departureTime", e.target.value)}
                placeholder="5:27 AM"
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded">
                {editedData.departureTime || "—"}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="arrivalTime">Hora de llegada</Label>
            {isEditing ? (
              <Input
                id="arrivalTime"
                value={editedData.arrivalTime || ""}
                onChange={(e) => handleFieldChange("arrivalTime", e.target.value)}
                placeholder="7:30 AM"
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded">
                {editedData.arrivalTime || "—"}
              </p>
            )}
          </div>
        </div>

        {/* Confirmation Number and Price */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="confirmationNumber">Número de confirmación</Label>
            {isEditing ? (
              <Input
                id="confirmationNumber"
                value={editedData.confirmationNumber || ""}
                onChange={(e) => handleFieldChange("confirmationNumber", e.target.value)}
                placeholder="ABC123"
                className="font-mono"
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded font-mono">
                {editedData.confirmationNumber || "—"}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pricePerPerson">Precio por persona</Label>
            {isEditing ? (
              <Input
                id="pricePerPerson"
                type="number"
                step="0.01"
                value={editedData.pricePerPerson || ""}
                onChange={(e) => handleFieldChange("pricePerPerson", e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded">
                {editedData.pricePerPerson ? `${editedData.currency || "USD"} ${editedData.pricePerPerson}` : "—"}
              </p>
            )}
          </div>
        </div>

        {/* Passenger Names */}
        {(editedData.passengerNames?.length || isEditing) && (
          <div className="space-y-2">
            <Label htmlFor="passengerNames">Pasajeros</Label>
            {isEditing ? (
              <Input
                id="passengerNames"
                value={editedData.passengerNames?.join(", ") || ""}
                onChange={(e) => {
                  const names = e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                  setEditedData(prev => ({ ...prev, passengerNames: names.length > 0 ? names : undefined }))
                }}
                placeholder="Nombre 1, Nombre 2"
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded">
                {editedData.passengerNames?.join(", ") || "—"}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
          disabled={isSubmitting}
        >
          <Edit2 className="h-4 w-4 mr-2" />
          {isEditing ? "Ver resumen" : "Editar datos"}
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              "Guardando..."
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Agregar al viaje
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
