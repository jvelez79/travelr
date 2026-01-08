"use client"

import { useState, useEffect } from "react"
import { X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Accommodation, AccommodationType } from "@/types/accommodation"
import { calculateNights } from "@/types/accommodation"

interface EditAccommodationModalProps {
  accommodation: Accommodation | null
  open: boolean
  onClose: () => void
  onSave: (updated: Accommodation) => void
}

export function EditAccommodationModal({
  accommodation,
  open,
  onClose,
  onSave,
}: EditAccommodationModalProps) {
  const [editedData, setEditedData] = useState<Accommodation | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when accommodation changes
  useEffect(() => {
    if (accommodation) {
      setEditedData({ ...accommodation })
    }
  }, [accommodation])

  if (!open || !accommodation || !editedData) return null

  const handleFieldChange = <K extends keyof Accommodation>(
    field: K,
    value: Accommodation[K]
  ) => {
    setEditedData((prev) => {
      if (!prev) return prev
      const updated = { ...prev, [field]: value }

      // Recalculate nights if dates change
      if (field === 'checkIn' || field === 'checkOut') {
        if (updated.checkIn && updated.checkOut) {
          updated.nights = calculateNights(updated.checkIn, updated.checkOut)
        }
      }

      return updated
    })
  }

  const handleSubmit = () => {
    if (!editedData) return
    setIsSubmitting(true)

    const updated: Accommodation = {
      ...editedData,
      updatedAt: new Date().toISOString(),
    }

    onSave(updated)
    setIsSubmitting(false)
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Editar Alojamiento</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del alojamiento</Label>
            <Input
              id="name"
              value={editedData.name || ""}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              placeholder="Nombre del hotel"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de alojamiento</Label>
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
          </div>

          {/* Area */}
          <div className="space-y-2">
            <Label htmlFor="area">Zona / Ciudad</Label>
            <Input
              id="area"
              value={editedData.area || ""}
              onChange={(e) => handleFieldChange("area", e.target.value)}
              placeholder="La Fortuna, San José..."
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkIn">Check-in</Label>
              <Input
                id="checkIn"
                type="date"
                value={editedData.checkIn || ""}
                onChange={(e) => handleFieldChange("checkIn", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOut">Check-out</Label>
              <Input
                id="checkOut"
                type="date"
                value={editedData.checkOut || ""}
                onChange={(e) => handleFieldChange("checkOut", e.target.value)}
              />
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkInTime">Hora check-in</Label>
              <Input
                id="checkInTime"
                value={editedData.checkInTime || ""}
                onChange={(e) => handleFieldChange("checkInTime", e.target.value)}
                placeholder="3:00 PM"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOutTime">Hora check-out</Label>
              <Input
                id="checkOutTime"
                value={editedData.checkOutTime || ""}
                onChange={(e) => handleFieldChange("checkOutTime", e.target.value)}
                placeholder="11:00 AM"
              />
            </div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricePerNight">Precio/noche</Label>
              <Input
                id="pricePerNight"
                type="number"
                value={editedData.pricePerNight || ""}
                onChange={(e) => handleFieldChange("pricePerNight", e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalPrice">Precio total</Label>
              <Input
                id="totalPrice"
                type="number"
                value={editedData.totalPrice || ""}
                onChange={(e) => handleFieldChange("totalPrice", e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Input
                id="currency"
                value={editedData.currency || "USD"}
                onChange={(e) => handleFieldChange("currency", e.target.value)}
                placeholder="USD"
              />
            </div>
          </div>

          {/* Confirmation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="confirmationNumber">Confirmaci&oacute;n</Label>
              <Input
                id="confirmationNumber"
                value={editedData.confirmationNumber || ""}
                onChange={(e) => handleFieldChange("confirmationNumber", e.target.value)}
                placeholder="ABC123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bookingPlatform">Plataforma</Label>
              <Input
                id="bookingPlatform"
                value={editedData.bookingPlatform || ""}
                onChange={(e) => handleFieldChange("bookingPlatform", e.target.value)}
                placeholder="Booking.com"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={editedData.notes || ""}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              placeholder="Notas adicionales..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                "Guardando..."
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
