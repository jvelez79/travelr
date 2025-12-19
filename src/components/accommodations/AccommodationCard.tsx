"use client"

import { Calendar, MapPin, Hash, Building2, ExternalLink, MoreHorizontal, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AccommodationReservation } from "@/types/accommodation"
import { getSourceDisplayName } from "@/types/accommodation"

interface AccommodationCardProps {
  reservation: AccommodationReservation
  onClick?: (reservation: AccommodationReservation) => void
  onEdit?: (reservation: AccommodationReservation) => void
  onDelete?: (reservation: AccommodationReservation) => void
}

function AccommodationCard({
  reservation,
  onClick,
  onEdit,
  onDelete,
}: AccommodationCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    })
  }

  const formatCurrency = (amount: number | undefined, currency: string) => {
    if (!amount) return null
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = () => {
    switch (reservation.status) {
      case "confirmed":
        return <Badge variant="default" className="bg-green-600">Confirmado</Badge>
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Pendiente</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>
    }
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
    return typeLabels[reservation.type] || reservation.type
  }

  return (
    <Card
      className="overflow-hidden transition-all hover:shadow-md cursor-pointer"
      onClick={() => onClick?.(reservation)}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{getTypeBadge()}</Badge>
              {getStatusBadge()}
            </div>
            <h3 className="font-semibold text-lg truncate">{reservation.name}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onEdit?.(reservation)
              }}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(reservation)
                }}
                className="text-destructive"
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Location */}
        {(reservation.city || reservation.address) && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {reservation.city}
              {reservation.country && `, ${reservation.country}`}
            </span>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-4 text-sm mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {formatDate(reservation.checkIn)} - {formatDate(reservation.checkOut)}
            </span>
          </div>
          <span className="text-muted-foreground">
            ({reservation.nights} {reservation.nights === 1 ? "noche" : "noches"})
          </span>
        </div>

        {/* Check-in/out times */}
        {(reservation.checkInTime || reservation.checkOutTime) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {reservation.checkInTime && (
              <span>Check-in: {reservation.checkInTime}</span>
            )}
            {reservation.checkOutTime && (
              <span>Check-out: {reservation.checkOutTime}</span>
            )}
          </div>
        )}

        {/* Confirmation Number */}
        {reservation.confirmationNumber && (
          <div className="flex items-center gap-1.5 text-sm mb-3">
            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-muted-foreground">
              {reservation.confirmationNumber}
            </span>
          </div>
        )}

        {/* Guest Names */}
        {reservation.guestNames && reservation.guestNames.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm mb-3">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground truncate">
              {reservation.guestNames.join(", ")}
            </span>
          </div>
        )}

        {/* Price and Platform */}
        <div className="flex items-end justify-between pt-3 border-t">
          <div>
            {reservation.totalPrice && (
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(reservation.totalPrice, reservation.currency)}
                </p>
              </div>
            )}
            {reservation.pricePerNight && !reservation.totalPrice && (
              <div>
                <p className="text-xs text-muted-foreground">Por noche</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(reservation.pricePerNight, reservation.currency)}
                </p>
              </div>
            )}
          </div>
          <div className="text-right">
            {reservation.bookingPlatform && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span>{reservation.bookingPlatform}</span>
              </div>
            )}
            {reservation.bookingUrl && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(reservation.bookingUrl, "_blank")
                }}
              >
                Ver reserva
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Source indicator */}
        <div className="mt-3 pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Agregado via {getSourceDisplayName(reservation.source)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
