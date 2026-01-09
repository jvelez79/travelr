"use client"

import { useState } from "react"
import { Check, AlertTriangle, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { ExtractedAccommodationData, AccommodationType } from "@/types/accommodation"

interface ExtractedDataConfirmationProps {
  data: ExtractedAccommodationData
  onConfirm: (data: ExtractedAccommodationData) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function ExtractedDataConfirmation({
  data,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: ExtractedDataConfirmationProps) {
  const [editedData, setEditedData] = useState<ExtractedAccommodationData>(data)
  const [isEditing, setIsEditing] = useState(false)

  const confidenceLevel = data.confidence >= 0.8 ? "high" : data.confidence >= 0.5 ? "medium" : "low"
  const confidenceColor = {
    high: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-red-100 text-red-800",
  }[confidenceLevel]

  const handleFieldChange = (field: keyof ExtractedAccommodationData, value: string | number | undefined) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = () => {
    onConfirm(editedData)
  }

  const accommodationTypes: { value: AccommodationType; label: string }[] = [
    { value: "hotel", label: "Hotel" },
    { value: "airbnb", label: "Airbnb" },
    { value: "hostel", label: "Hostal" },
    { value: "resort", label: "Resort" },
    { value: "vacation_rental", label: "Alquiler Vacacional" },
    { value: "apartment", label: "Apartamento" },
    { value: "other", label: "Otro" },
  ]

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
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del alojamiento</Label>
          {isEditing ? (
            <Input
              id="name"
              value={editedData.name || ""}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              placeholder="Nombre del hotel"
            />
          ) : (
            <p className="text-sm font-medium p-2 bg-muted rounded">
              {editedData.name || "—"}
            </p>
          )}
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Tipo de alojamiento</Label>
          {isEditing ? (
            <select
              id="type"
              value={editedData.type || "hotel"}
              onChange={(e) => handleFieldChange("type", e.target.value as AccommodationType)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {accommodationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm font-medium p-2 bg-muted rounded">
              {accommodationTypes.find((t) => t.value === editedData.type)?.label || editedData.type || "—"}
            </p>
          )}
        </div>

        {/* Location */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            {isEditing ? (
              <Input
                id="city"
                value={editedData.city || ""}
                onChange={(e) => handleFieldChange("city", e.target.value)}
                placeholder="Ciudad"
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded">
                {editedData.city || "—"}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            {isEditing ? (
              <Input
                id="country"
                value={editedData.country || ""}
                onChange={(e) => handleFieldChange("country", e.target.value)}
                placeholder="País"
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded">
                {editedData.country || "—"}
              </p>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="checkIn">Check-in</Label>
            {isEditing ? (
              <Input
                id="checkIn"
                type="date"
                value={editedData.checkIn || ""}
                onChange={(e) => handleFieldChange("checkIn", e.target.value)}
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded">
                {editedData.checkIn || "—"}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkOut">Check-out</Label>
            {isEditing ? (
              <Input
                id="checkOut"
                type="date"
                value={editedData.checkOut || ""}
                onChange={(e) => handleFieldChange("checkOut", e.target.value)}
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded">
                {editedData.checkOut || "—"}
              </p>
            )}
          </div>
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="checkInTime">Hora check-in</Label>
            {isEditing ? (
              <Input
                id="checkInTime"
                value={editedData.checkInTime || ""}
                onChange={(e) => handleFieldChange("checkInTime", e.target.value)}
                placeholder="3:00 PM"
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded">
                {editedData.checkInTime || "—"}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkOutTime">Hora check-out</Label>
            {isEditing ? (
              <Input
                id="checkOutTime"
                value={editedData.checkOutTime || ""}
                onChange={(e) => handleFieldChange("checkOutTime", e.target.value)}
                placeholder="11:00 AM"
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded">
                {editedData.checkOutTime || "—"}
              </p>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="totalPrice">Precio total</Label>
            {isEditing ? (
              <Input
                id="totalPrice"
                type="number"
                value={editedData.totalPrice || ""}
                onChange={(e) => handleFieldChange("totalPrice", e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded">
                {editedData.totalPrice ? `${editedData.currency || "USD"} ${editedData.totalPrice}` : "—"}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            {isEditing ? (
              <Input
                id="currency"
                value={editedData.currency || "USD"}
                onChange={(e) => handleFieldChange("currency", e.target.value)}
                placeholder="USD"
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded">
                {editedData.currency || "USD"}
              </p>
            )}
          </div>
        </div>

        {/* Confirmation */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="confirmationNumber">Número de confirmación</Label>
            {isEditing ? (
              <Input
                id="confirmationNumber"
                value={editedData.confirmationNumber || ""}
                onChange={(e) => handleFieldChange("confirmationNumber", e.target.value)}
                placeholder="ABC123"
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded font-mono">
                {editedData.confirmationNumber || "—"}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bookingPlatform">Plataforma</Label>
            {isEditing ? (
              <Input
                id="bookingPlatform"
                value={editedData.bookingPlatform || ""}
                onChange={(e) => handleFieldChange("bookingPlatform", e.target.value)}
                placeholder="Booking.com"
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded">
                {editedData.bookingPlatform || "—"}
              </p>
            )}
          </div>
        </div>

        {/* Guest Names */}
        {(editedData.guestNames?.length || isEditing) && (
          <div className="space-y-2">
            <Label htmlFor="guestNames">Huéspedes</Label>
            {isEditing ? (
              <Input
                id="guestNames"
                value={editedData.guestNames?.join(", ") || ""}
                onChange={(e) => {
                  const names = e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                  setEditedData(prev => ({ ...prev, guestNames: names.length > 0 ? names : undefined }))
                }}
                placeholder="Nombre 1, Nombre 2"
              />
            ) : (
              <p className="text-sm font-medium p-2 bg-muted rounded">
                {editedData.guestNames?.join(", ") || "—"}
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
