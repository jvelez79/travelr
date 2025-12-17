"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Hotel, CheckCircle, Clock, Sparkles, ExternalLink, Star } from "lucide-react"
import type { Accommodation, AccommodationStatus, AccommodationType } from "@/types/accommodation"
import { cn } from "@/lib/utils"
import { calculateNights } from "@/types/accommodation"

interface AccommodationEditorProps {
  accommodation: Accommodation | null
  isOpen: boolean
  onClose: () => void
  onSave: (accommodation: Accommodation) => void
  mode: "edit" | "create"
}

const ACCOMMODATION_TYPES: { value: AccommodationType; label: string; emoji: string }[] = [
  { value: "hotel", label: "Hotel", emoji: "🏨" },
  { value: "airbnb", label: "Airbnb", emoji: "🏠" },
  { value: "hostel", label: "Hostel", emoji: "🛏️" },
  { value: "resort", label: "Resort", emoji: "🏝️" },
  { value: "vacation_rental", label: "Vacation Rental", emoji: "🏡" },
  { value: "apartment", label: "Apartamento", emoji: "🏢" },
  { value: "other", label: "Otro", emoji: "🏛️" },
]

const STATUS_OPTIONS: { value: AccommodationStatus; label: string; description: string }[] = [
  { value: "suggested", label: "Sugerencia AI", description: "Pendiente de revisión" },
  { value: "pending", label: "Pendiente", description: "Seleccionado, sin confirmar reserva" },
  { value: "confirmed", label: "Confirmado", description: "Reserva confirmada" },
]

export function AccommodationEditor({
  accommodation,
  isOpen,
  onClose,
  onSave,
  mode,
}: AccommodationEditorProps) {
  const [formData, setFormData] = useState<Partial<Accommodation>>({})

  useEffect(() => {
    if (accommodation && mode === "edit") {
      setFormData({
        ...accommodation,
      })
    } else if (mode === "create") {
      const now = new Date().toISOString()
      setFormData({
        id: crypto.randomUUID(),
        name: "",
        type: "hotel",
        area: "",
        checkIn: "",
        checkOut: "",
        checkInTime: "3:00 PM",
        checkOutTime: "11:00 AM",
        nights: 0,
        currency: "USD",
        origin: "user_added",
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
    }
  }, [accommodation, mode, isOpen])

  if (!isOpen) return null

  // Check if this is a linked Google Place
  const isLinkedPlace = !!(formData.googlePlaceId || formData.placeData)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Calculate nights
    const nights = formData.checkIn && formData.checkOut
      ? calculateNights(formData.checkIn, formData.checkOut)
      : 0

    // Calculate total price
    const totalPrice = formData.pricePerNight
      ? formData.pricePerNight * nights
      : undefined

    const savedAccommodation: Accommodation = {
      id: formData.id || crypto.randomUUID(),
      name: formData.name || "",
      type: formData.type || "hotel",
      area: formData.area || "",
      checkIn: formData.checkIn || "",
      checkOut: formData.checkOut || "",
      checkInTime: formData.checkInTime,
      checkOutTime: formData.checkOutTime,
      nights,
      pricePerNight: formData.pricePerNight,
      totalPrice,
      currency: formData.currency || "USD",
      // Preserve Google Places data
      googlePlaceId: formData.googlePlaceId,
      placeData: formData.placeData,
      matchConfidence: formData.matchConfidence,
      bookingLinks: formData.bookingLinks,
      // Status and origin
      origin: formData.origin || "user_added",
      status: formData.status || "pending",
      // Booking details
      confirmationNumber: formData.confirmationNumber,
      bookingPlatform: formData.bookingPlatform,
      bookingUrl: formData.bookingUrl,
      // AI info
      whyThisPlace: formData.whyThisPlace,
      amenities: formData.amenities,
      // Meta
      source: formData.source,
      notes: formData.notes,
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onSave(savedAccommodation)
    onClose()
  }

  const handleChange = (field: keyof Accommodation, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Calculate nights when dates change
  const calculatedNights = formData.checkIn && formData.checkOut
    ? calculateNights(formData.checkIn, formData.checkOut)
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
          <div className="flex items-center gap-2">
            <Hotel className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {mode === "edit" ? "Editar Alojamiento" : "Nuevo Alojamiento"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Linked Place Indicator */}
          {isLinkedPlace && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <div className="flex-1">
                <p className="text-xs font-medium text-green-700 dark:text-green-400">
                  Vinculado a Google Places
                </p>
                <p className="text-[10px] text-green-600 dark:text-green-500">
                  El nombre y ubicacion no son editables para mantener la vinculacion
                </p>
              </div>
              {formData.placeData?.rating && (
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <Star className="w-3 h-3 fill-current" />
                  {formData.placeData.rating}
                </div>
              )}
            </div>
          )}

          {/* Status Selector */}
          <div className="space-y-2">
            <Label>Estado</Label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange("status", option.value)}
                  className={cn(
                    "p-2 rounded-lg border text-center transition-all",
                    formData.status === option.value
                      ? option.value === "confirmed"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                        : option.value === "pending"
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/30"
                        : "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {option.value === "confirmed" && <CheckCircle className="w-3 h-3 text-green-600" />}
                    {option.value === "pending" && <Clock className="w-3 h-3 text-amber-600" />}
                    {option.value === "suggested" && <Sparkles className="w-3 h-3 text-blue-600" />}
                  </div>
                  <p className="text-xs font-medium">{option.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Alojamiento *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Hotel Paradise"
              value={formData.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              disabled={isLinkedPlace}
              className={isLinkedPlace ? "bg-muted/50 cursor-not-allowed" : ""}
            />
          </div>

          {/* Type Selector */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="flex flex-wrap gap-2">
              {ACCOMMODATION_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleChange("type", type.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-sm transition-all flex items-center gap-1.5",
                    formData.type === type.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  <span>{type.emoji}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Area */}
          <div className="space-y-2">
            <Label htmlFor="area">Zona / Ciudad</Label>
            <Input
              id="area"
              type="text"
              placeholder="Manuel Antonio"
              value={formData.area || ""}
              onChange={(e) => handleChange("area", e.target.value)}
              disabled={isLinkedPlace}
              className={isLinkedPlace ? "bg-muted/50 cursor-not-allowed" : ""}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkIn">Check-in</Label>
              <Input
                id="checkIn"
                type="date"
                value={formData.checkIn || ""}
                onChange={(e) => handleChange("checkIn", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOut">Check-out</Label>
              <Input
                id="checkOut"
                type="date"
                value={formData.checkOut || ""}
                onChange={(e) => handleChange("checkOut", e.target.value)}
              />
            </div>
          </div>

          {/* Nights indicator */}
          {calculatedNights > 0 && (
            <p className="text-xs text-muted-foreground">
              {calculatedNights} {calculatedNights === 1 ? "noche" : "noches"}
            </p>
          )}

          {/* Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="checkInTime">Hora Check-in</Label>
              <Input
                id="checkInTime"
                type="text"
                placeholder="3:00 PM"
                value={formData.checkInTime || ""}
                onChange={(e) => handleChange("checkInTime", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOutTime">Hora Check-out</Label>
              <Input
                id="checkOutTime"
                type="text"
                placeholder="11:00 AM"
                value={formData.checkOutTime || ""}
                onChange={(e) => handleChange("checkOutTime", e.target.value)}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricePerNight">Precio por Noche</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  id="pricePerNight"
                  type="number"
                  placeholder="100"
                  value={formData.pricePerNight || ""}
                  onChange={(e) => handleChange("pricePerNight", e.target.value ? Number(e.target.value) : undefined)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Total Estimado</Label>
              <div className="h-10 px-3 flex items-center rounded-md border border-input bg-muted/50 text-sm">
                {formData.pricePerNight && calculatedNights > 0
                  ? `$${formData.pricePerNight * calculatedNights}`
                  : "-"}
              </div>
            </div>
          </div>

          {/* Confirmation Details (only show when confirmed or pending) */}
          {(formData.status === "confirmed" || formData.status === "pending") && (
            <>
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-sm font-medium mb-3">Detalles de Reserva</p>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="confirmationNumber">Numero de Confirmacion</Label>
                    <Input
                      id="confirmationNumber"
                      type="text"
                      placeholder="ABC123456"
                      value={formData.confirmationNumber || ""}
                      onChange={(e) => handleChange("confirmationNumber", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bookingPlatform">Plataforma de Reserva</Label>
                    <Input
                      id="bookingPlatform"
                      type="text"
                      placeholder="Booking.com, Expedia, Airbnb..."
                      value={formData.bookingPlatform || ""}
                      onChange={(e) => handleChange("bookingPlatform", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bookingUrl">URL de Reserva</Label>
                    <div className="flex gap-2">
                      <Input
                        id="bookingUrl"
                        type="url"
                        placeholder="https://..."
                        value={formData.bookingUrl || ""}
                        onChange={(e) => handleChange("bookingUrl", e.target.value)}
                        className="flex-1"
                      />
                      {formData.bookingUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(formData.bookingUrl, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <textarea
              id="notes"
              className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Notas adicionales..."
              value={formData.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>

          {/* AI Reason (read-only if present) */}
          {formData.whyThisPlace && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                  Razon de la sugerencia AI
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                {formData.whyThisPlace}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!formData.name?.trim()}
            >
              {mode === "edit" ? "Guardar Cambios" : "Anadir Alojamiento"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
