"use client"

import { Hotel, MapPin, Calendar, DollarSign, Wifi, Car, Coffee, CheckCircle, Clock, Sparkles } from "lucide-react"
import { useCanvasContext } from "../CanvasContext"
import type { Accommodation, AccommodationStatus } from "@/types/accommodation"
import { cn } from "@/lib/utils"

// Map common amenities to icons
const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "WiFi": <Wifi className="w-3.5 h-3.5" />,
  "Parking": <Car className="w-3.5 h-3.5" />,
  "Estacionamiento": <Car className="w-3.5 h-3.5" />,
  "Desayuno": <Coffee className="w-3.5 h-3.5" />,
  "Breakfast": <Coffee className="w-3.5 h-3.5" />,
}

// Status configuration
const STATUS_CONFIG: Record<AccommodationStatus, {
  label: string
  icon: React.ReactNode
  className: string
}> = {
  suggested: {
    label: "Sugerencia AI",
    icon: <Sparkles className="w-3.5 h-3.5" />,
    className: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
  },
  pending: {
    label: "Pendiente",
    icon: <Clock className="w-3.5 h-3.5" />,
    className: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
  },
  confirmed: {
    label: "Confirmado",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    className: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
  },
  cancelled: {
    label: "Cancelado",
    icon: null,
    className: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
  },
}

interface AccommodationDetailsProps {
  accommodation: Accommodation
}

export function AccommodationDetails({ accommodation }: AccommodationDetailsProps) {
  const { clearRightPanel } = useCanvasContext()

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  }

  const getAccommodationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hotel: "Hotel",
      airbnb: "Airbnb",
      hostel: "Hostel",
      mixed: "Mixto",
    }
    return labels[type] || type
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Alojamiento</h3>
        <button
          onClick={clearRightPanel}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Accommodation info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Hotel className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h4 className="font-semibold text-lg text-foreground">{accommodation.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {getAccommodationTypeLabel(accommodation.type)}
                </span>
                {/* Status Badge */}
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  STATUS_CONFIG[accommodation.status].className
                )}>
                  {STATUS_CONFIG[accommodation.status].icon}
                  {STATUS_CONFIG[accommodation.status].label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{accommodation.area}</p>
              {accommodation.placeData?.coordinates && (
                <a
                  href={`https://www.google.com/maps?q=${accommodation.placeData.coordinates.lat},${accommodation.placeData.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Ver en Google Maps
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Check-in / Check-out */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wide">
                Check-in
              </span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {formatDate(accommodation.checkIn)}
            </p>
            {accommodation.checkInTime && (
              <p className="text-xs text-muted-foreground">{accommodation.checkInTime}</p>
            )}
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-medium text-orange-700 dark:text-orange-400 uppercase tracking-wide">
                Check-out
              </span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {formatDate(accommodation.checkOut)}
            </p>
            {accommodation.checkOutTime && (
              <p className="text-xs text-muted-foreground">{accommodation.checkOutTime}</p>
            )}
          </div>
        </div>

        {/* Stay duration */}
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
          <span className="text-sm text-muted-foreground">Noches</span>
          <span className="text-sm font-semibold text-foreground">{accommodation.nights}</span>
        </div>

        {/* Price */}
        {accommodation.pricePerNight && accommodation.pricePerNight > 0 && (
          <div>
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Precio
            </h5>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-lg font-semibold text-foreground">
                ${accommodation.pricePerNight}
              </span>
              <span className="text-sm text-muted-foreground">/ noche</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Total estimado: <span className="font-medium text-foreground">
                ${accommodation.pricePerNight * accommodation.nights}
              </span>
            </p>
          </div>
        )}

        {/* Amenities */}
        {accommodation.amenities && accommodation.amenities.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Amenidades
            </h5>
            <div className="flex flex-wrap gap-2">
              {accommodation.amenities.map((amenity, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs text-foreground"
                >
                  {AMENITY_ICONS[amenity] || null}
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Why this place (AI suggestions) */}
        {accommodation.whyThisPlace && (
          <div>
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Por que este lugar
            </h5>
            <p className="text-sm text-foreground bg-primary/5 rounded-lg p-3 border-l-2 border-primary">
              {accommodation.whyThisPlace}
            </p>
          </div>
        )}

        {/* User notes */}
        {accommodation.notes && (
          <div>
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Notas
            </h5>
            <p className="text-sm text-foreground">{accommodation.notes}</p>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Este alojamiento es el punto de partida para las actividades del dia.
        </p>
      </div>
    </div>
  )
}
