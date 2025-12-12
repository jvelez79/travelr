"use client"

import { Plane, Copy, Pencil, Trash2 } from "lucide-react"
import type { FlightReservation } from "@/types/plan"

interface FlightCardProps {
  flight: FlightReservation
  onEdit?: (flight: FlightReservation) => void
  onDelete?: (id: string) => void
}

export function FlightCard({ flight, onEdit, onDelete }: FlightCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const copyConfirmation = () => {
    if (flight.confirmationNumber) {
      navigator.clipboard.writeText(flight.confirmationNumber)
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-all group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Route */}
          <div className="flex items-center gap-4 mb-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{flight.origin}</p>
              <p className="text-xs text-muted-foreground">{flight.originCity}</p>
            </div>
            <div className="flex-1 flex items-center gap-2 px-2">
              <div className="flex-1 h-px bg-border" />
              <Plane className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{flight.destination}</p>
              <p className="text-xs text-muted-foreground">{flight.destinationCity}</p>
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">{formatDate(flight.date)}</p>
            <p className="font-medium">{flight.departureTime} — {flight.arrivalTime}</p>
            <p className="text-xs text-muted-foreground uppercase">{flight.airline}</p>
          </div>

          {/* Confirmation and Notes */}
          <div className="mt-4 pt-4 border-t border-border flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              {flight.confirmationNumber && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Confirmacion:</span>
                  <span className="text-sm font-medium">{flight.confirmationNumber}</span>
                  <button
                    onClick={copyConfirmation}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title="Copiar"
                  >
                    <Copy className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              )}
              {flight.notes && (
                <p className="text-xs text-muted-foreground">{flight.notes}</p>
              )}
            </div>
            {flight.pricePerPerson && (
              <div className="text-right">
                <p className="text-lg font-semibold text-primary">
                  ${flight.pricePerPerson.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground">por persona</p>
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
