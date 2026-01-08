"use client"

import {
  Calendar,
  MapPin,
  Hash,
  Building2,
  ExternalLink,
  MoreHorizontal,
  Search,
  Trash2,
  Edit,
  CheckCircle,
  Sparkles,
  Clock,
  X
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Accommodation, AccommodationStatus } from "@/types/accommodation"
import { getAccommodationSourceDisplayName } from "@/types/accommodation"
import { cn } from "@/lib/utils"
import { formatDateShort } from "@/lib/date-utils"

interface UnifiedAccommodationCardProps {
  accommodation: Accommodation
  onClick?: (accommodation: Accommodation) => void
  onEdit?: (accommodation: Accommodation) => void
  onDelete?: (accommodation: Accommodation) => void
  onReplace?: (accommodation: Accommodation) => void
  onBookNow?: (accommodation: Accommodation) => void
  onMarkConfirmed?: (accommodation: Accommodation) => void
  onDismiss?: (accommodation: Accommodation) => void
}

// Status configuration for visual styling
const STATUS_CONFIG: Record<AccommodationStatus, {
  label: string
  icon: React.ReactNode
  badgeClass: string
  borderClass: string
}> = {
  suggested: {
    label: "Sugerencia AI",
    icon: <Sparkles className="h-3 w-3" />,
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    borderClass: "border-blue-300 dark:border-blue-700 border-dashed",
  },
  pending: {
    label: "Pendiente",
    icon: <Clock className="h-3 w-3" />,
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    borderClass: "border-amber-300 dark:border-amber-500",
  },
  confirmed: {
    label: "Confirmado",
    icon: <CheckCircle className="h-3 w-3" />,
    badgeClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    borderClass: "border-green-500 dark:border-green-600",
  },
  cancelled: {
    label: "Cancelado",
    icon: <X className="h-3 w-3" />,
    badgeClass: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    borderClass: "border-gray-300 dark:border-gray-600",
  },
}

export function UnifiedAccommodationCard({
  accommodation,
  onClick,
  onEdit,
  onDelete,
  onReplace,
  onBookNow,
  onMarkConfirmed,
  onDismiss,
}: UnifiedAccommodationCardProps) {
  const status = accommodation.status
  const statusConfig = STATUS_CONFIG[status]
  const isSuggestion = status === "suggested"
  const isPending = status === "pending"
  const isConfirmed = status === "confirmed"

  const formatCurrency = (amount: number | undefined, currency: string) => {
    if (!amount) return null
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getTypeBadge = () => {
    const typeLabels: Record<string, string> = {
      hotel: "Hotel",
      airbnb: "Airbnb",
      hostel: "Hostal",
      resort: "Resort",
      vacation_rental: "Alquiler Vacacional",
      apartment: "Apartamento",
      other: "Otro",
    }
    return typeLabels[accommodation.type] || accommodation.type
  }

  // Actions based on status
  const renderActions = () => {
    if (isSuggestion) {
      // AI Suggestion: Book Now, Replace, Dismiss
      return (
        <div className="flex items-center gap-2">
          {onBookNow && (
            <Button
              size="sm"
              variant="default"
              onClick={(e) => {
                e.stopPropagation()
                onBookNow(accommodation)
              }}
            >
              <Search className="h-3 w-3 mr-1" />
              Buscar
            </Button>
          )}
          {onReplace && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onReplace(accommodation)
              }}
            >
              Reemplazar
            </Button>
          )}
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation()
                onDismiss(accommodation)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }

    // Pending/Confirmed: Dropdown menu with Edit, Mark Confirmed, Delete
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onEdit && (
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              onEdit(accommodation)
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
          )}
          {isPending && onMarkConfirmed && (
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              onMarkConfirmed(accommodation)
            }}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar confirmado
            </DropdownMenuItem>
          )}
          {onReplace && (
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              onReplace(accommodation)
            }}>
              <Search className="h-4 w-4 mr-2" />
              Reemplazar
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {onDelete && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDelete(accommodation)
              }}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:shadow-md cursor-pointer border-2",
        statusConfig.borderClass
      )}
      onClick={() => onClick?.(accommodation)}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline">{getTypeBadge()}</Badge>
              <Badge className={cn("flex items-center gap-1", statusConfig.badgeClass)}>
                {statusConfig.icon}
                {statusConfig.label}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg truncate">{accommodation.name}</h3>
          </div>
          {renderActions()}
        </div>

        {/* Location */}
        {accommodation.area && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{accommodation.area}</span>
          </div>
        )}

        {/* AI Suggestion reason */}
        {isSuggestion && accommodation.whyThisPlace && (
          <p className="text-sm italic text-muted-foreground mb-3 bg-blue-50 dark:bg-blue-950/30 p-2 rounded">
            "{accommodation.whyThisPlace}"
          </p>
        )}

        {/* Dates */}
        <div className="flex items-center gap-4 text-sm mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {formatDateShort(accommodation.checkIn)} - {formatDateShort(accommodation.checkOut)}
            </span>
          </div>
          <span className="text-muted-foreground">
            ({accommodation.nights} {accommodation.nights === 1 ? "noche" : "noches"})
          </span>
        </div>

        {/* Check-in/out times */}
        {(accommodation.checkInTime || accommodation.checkOutTime) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {accommodation.checkInTime && (
              <span>Check-in: {accommodation.checkInTime}</span>
            )}
            {accommodation.checkOutTime && (
              <span>Check-out: {accommodation.checkOutTime}</span>
            )}
          </div>
        )}

        {/* Confirmation Number */}
        {accommodation.confirmationNumber && isConfirmed && (
          <div className="flex items-center gap-1.5 text-sm mb-3">
            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-muted-foreground">
              {accommodation.confirmationNumber}
            </span>
          </div>
        )}

        {/* Amenities */}
        {accommodation.amenities && accommodation.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {accommodation.amenities.slice(0, 4).map((amenity, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
              >
                {amenity}
              </span>
            ))}
            {accommodation.amenities.length > 4 && (
              <span className="px-2 py-0.5 text-muted-foreground text-xs">
                +{accommodation.amenities.length - 4} más
              </span>
            )}
          </div>
        )}

        {/* Price and Platform */}
        <div className="flex items-end justify-between pt-3 border-t">
          <div>
            {accommodation.totalPrice && (
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(accommodation.totalPrice, accommodation.currency)}
                </p>
              </div>
            )}
            {accommodation.pricePerNight && !accommodation.totalPrice && (
              <div>
                <p className="text-xs text-muted-foreground">Por noche</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(accommodation.pricePerNight, accommodation.currency)}
                </p>
              </div>
            )}
          </div>
          <div className="text-right">
            {accommodation.bookingPlatform && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span>{accommodation.bookingPlatform}</span>
              </div>
            )}
            {accommodation.bookingUrl && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(accommodation.bookingUrl, "_blank")
                }}
              >
                Ver reserva
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Source indicator */}
        {accommodation.source && (
          <div className="mt-3 pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Agregado via {getAccommodationSourceDisplayName(accommodation.source)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
