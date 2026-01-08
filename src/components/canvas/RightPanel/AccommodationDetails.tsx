"use client"

import {
  Hotel,
  MapPin,
  Calendar,
  DollarSign,
  Wifi,
  Car,
  Coffee,
  CheckCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Edit,
  RefreshCw,
  Trash2,
  Search,
  X
} from "lucide-react"
import { useCanvasContext } from "../CanvasContext"
import { Button } from "@/components/ui/button"
import type { Accommodation, AccommodationStatus } from "@/types/accommodation"
import { cn } from "@/lib/utils"
import { formatDateWithWeekday } from "@/lib/date-utils"

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
  onEdit?: (accommodation: Accommodation) => void
  onDelete?: (accommodation: Accommodation) => void
  onReplace?: (accommodation: Accommodation) => void
  onMarkConfirmed?: (accommodation: Accommodation) => void
  onDismiss?: (accommodation: Accommodation) => void
  onBookNow?: (accommodation: Accommodation) => void
}

export function AccommodationDetails({
  accommodation,
  onEdit,
  onDelete,
  onReplace,
  onMarkConfirmed,
  onDismiss,
  onBookNow
}: AccommodationDetailsProps) {
  const { clearRightPanel } = useCanvasContext()

  const isSuggestion = accommodation.status === 'suggested'
  const isPending = accommodation.status === 'pending'
  const isConfirmed = accommodation.status === 'confirmed'

  const getAccommodationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hotel: "Hotel",
      airbnb: "Airbnb",
      hostel: "Hostel",
      resort: "Resort",
      vacation_rental: "Alquiler Vacacional",
      apartment: "Apartamento",
      other: "Otro",
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
          <X className="w-5 h-5 text-muted-foreground" />
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
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-lg text-foreground truncate">{accommodation.name}</h4>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
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

        {/* Action Buttons based on status */}
        <div className="space-y-2">
          {isSuggestion && (
            <div className="flex gap-2">
              {onBookNow && (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => onBookNow(accommodation)}
                >
                  <Search className="w-4 h-4 mr-1" />
                  Buscar similar
                </Button>
              )}
              {onDismiss && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDismiss(accommodation)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Descartar
                </Button>
              )}
            </div>
          )}

          {isPending && (
            <div className="flex gap-2">
              {onMarkConfirmed && (
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1"
                  onClick={() => onMarkConfirmed(accommodation)}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Marcar confirmado
                </Button>
              )}
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(accommodation)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {isConfirmed && onEdit && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => onEdit(accommodation)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar detalles
            </Button>
          )}

          {(isPending || isConfirmed) && onReplace && (
            <Button
              size="sm"
              variant="ghost"
              className="w-full"
              onClick={() => onReplace(accommodation)}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Reemplazar alojamiento
            </Button>
          )}
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
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  Ver en Google Maps
                  <ExternalLink className="w-3 h-3" />
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
              {formatDateWithWeekday(accommodation.checkIn)}
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
              {formatDateWithWeekday(accommodation.checkOut)}
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
            {accommodation.totalPrice ? (
              <p className="text-sm text-muted-foreground mt-1">
                Total: <span className="font-medium text-foreground">
                  ${accommodation.totalPrice}
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                Total estimado: <span className="font-medium text-foreground">
                  ${accommodation.pricePerNight * accommodation.nights}
                </span>
              </p>
            )}
          </div>
        )}

        {/* Booking Link */}
        {accommodation.bookingUrl && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.open(accommodation.bookingUrl, "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver reserva en {accommodation.bookingPlatform || 'sitio'}
          </Button>
        )}

        {/* Confirmation Number */}
        {accommodation.confirmationNumber && (
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
            <h5 className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">
              Numero de confirmacion
            </h5>
            <p className="text-sm font-mono font-medium text-foreground">
              {accommodation.confirmationNumber}
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

      {/* Footer with delete action */}
      {onDelete && (isPending || isConfirmed) && (
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(accommodation)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar alojamiento
          </Button>
        </div>
      )}
    </div>
  )
}
