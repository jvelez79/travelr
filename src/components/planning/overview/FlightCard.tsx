"use client"

import { Plane, Copy, Pencil, Trash2, PlaneTakeoff, PlaneLanding, ArrowLeftRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FlightReservation, FlightType } from "@/types/plan"

interface FlightCardProps {
  flight: FlightReservation
  onEdit?: (flight: FlightReservation) => void
  onDelete?: (id: string) => void
  compact?: boolean
}

const FLIGHT_TYPE_CONFIG: Record<FlightType, { label: string; icon: typeof PlaneTakeoff; color: string }> = {
  outbound: { label: "Ida", icon: PlaneTakeoff, color: "text-blue-500" },
  return: { label: "Regreso", icon: PlaneLanding, color: "text-green-500" },
  connection: { label: "Conexion", icon: ArrowLeftRight, color: "text-amber-500" },
}

export function FlightCard({ flight, onEdit, onDelete, compact = false }: FlightCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (timeStr: string) => {
    // Handle both "HH:mm" format and "5:27 AM" format
    if (timeStr.includes(":") && !timeStr.includes(" ")) {
      // "HH:mm" format - convert to 12h
      const [hours, minutes] = timeStr.split(":").map(Number)
      const ampm = hours >= 12 ? "PM" : "AM"
      const hour12 = hours % 12 || 12
      return `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`
    }
    return timeStr
  }

  const copyConfirmation = () => {
    if (flight.confirmationNumber) {
      navigator.clipboard.writeText(flight.confirmationNumber)
    }
  }

  const typeConfig = flight.type ? FLIGHT_TYPE_CONFIG[flight.type] : FLIGHT_TYPE_CONFIG.outbound
  const TypeIcon = typeConfig.icon

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
        <div className={cn("p-2 rounded-lg bg-muted", typeConfig.color)}>
          <TypeIcon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{flight.origin}</span>
            <Plane className="w-3 h-3 text-muted-foreground" />
            <span className="font-semibold">{flight.destination}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {formatTime(flight.departureTime)} - {flight.airline}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-all group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Type Badge */}
          {flight.type && (
            <div className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium mb-4 px-2.5 py-1 rounded-full",
              flight.type === 'outbound' && "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400",
              flight.type === 'return' && "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400",
              flight.type === 'connection' && "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
            )}>
              <TypeIcon className="w-3.5 h-3.5" />
              <span>{typeConfig.label}</span>
            </div>
          )}

          {/* Route */}
          <div className="flex items-center gap-4 pb-4 mb-4 border-b border-border">
            <div className="text-center">
              <p className="text-xl font-bold tracking-tight">{flight.origin}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{flight.originCity}</p>
            </div>
            <div className="flex-1 flex items-center gap-2 px-3">
              <div className="flex-1 h-px bg-border" />
              <Plane className="w-4 h-4 text-muted-foreground rotate-90" />
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold tracking-tight">{flight.destination}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{flight.destinationCity}</p>
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-2 text-sm mb-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{formatDate(flight.date)}</span>
              {flight.arrivalDate && flight.arrivalDate !== flight.date && (
                <>
                  <span>→</span>
                  <span>{formatDate(flight.arrivalDate)}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <p className="font-semibold text-base text-foreground">
                {formatTime(flight.departureTime)} — {formatTime(flight.arrivalTime)}
              </p>
              <span className="text-muted-foreground">•</span>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {flight.airline}
              </p>
            </div>
          </div>

          {/* Confirmation and Price */}
          <div className="flex items-end justify-between gap-4 pt-4 border-t border-border">
            <div className="space-y-2 flex-1 min-w-0">
              {flight.confirmationNumber && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Confirmación:</span>
                  <code className="text-sm font-medium font-mono px-2 py-0.5 bg-muted/50 rounded">
                    {flight.confirmationNumber}
                  </code>
                  <button
                    onClick={copyConfirmation}
                    className="p-1 rounded hover:bg-muted transition-colors flex-shrink-0"
                    title="Copiar"
                  >
                    <Copy className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              )}
              {flight.notes && (
                <p className="text-xs text-muted-foreground line-clamp-2">{flight.notes}</p>
              )}
            </div>
            {flight.pricePerPerson && (
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold text-primary">
                  ${flight.pricePerPerson.toFixed(0)}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  por persona
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={() => onEdit(flight)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title="Editar"
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(flight.id)}
              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
