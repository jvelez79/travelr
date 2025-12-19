"use client"

import { Plane, PlaneTakeoff, PlaneLanding, ArrowLeftRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { FlightReservation, FlightType } from "@/types/plan"

interface FlightBadgeProps {
  flights: FlightReservation[]
  variant?: "inline" | "floating"
  className?: string
}

const FLIGHT_TYPE_CONFIG: Record<FlightType, { label: string; icon: typeof PlaneTakeoff; bgColor: string; textColor: string }> = {
  outbound: { label: "Vuelo de ida", icon: PlaneTakeoff, bgColor: "bg-blue-500/10", textColor: "text-blue-500" },
  return: { label: "Vuelo de regreso", icon: PlaneLanding, bgColor: "bg-green-500/10", textColor: "text-green-500" },
  connection: { label: "Conexion", icon: ArrowLeftRight, bgColor: "bg-amber-500/10", textColor: "text-amber-500" },
}

function formatTime(timeStr: string) {
  // Handle both "HH:mm" format and "5:27 AM" format
  if (timeStr.includes(":") && !timeStr.includes(" ")) {
    const [hours, minutes] = timeStr.split(":").map(Number)
    const ampm = hours >= 12 ? "PM" : "AM"
    const hour12 = hours % 12 || 12
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`
  }
  return timeStr
}

export function FlightBadge({ flights, variant = "inline", className }: FlightBadgeProps) {
  if (flights.length === 0) return null

  const singleFlight = flights.length === 1

  if (singleFlight) {
    const flight = flights[0]
    const typeConfig = flight.type ? FLIGHT_TYPE_CONFIG[flight.type] : FLIGHT_TYPE_CONFIG.outbound
    const TypeIcon = typeConfig.icon

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium cursor-default",
                typeConfig.bgColor,
                typeConfig.textColor,
                variant === "floating" && "shadow-sm",
                className
              )}
            >
              <TypeIcon className="w-3 h-3" />
              <span>{flight.origin} → {flight.destination}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{typeConfig.label}</p>
              <p className="text-sm">
                {flight.originCity} ({flight.origin}) → {flight.destinationCity} ({flight.destination})
              </p>
              <p className="text-sm text-muted-foreground">
                {formatTime(flight.departureTime)} - {flight.airline}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Multiple flights on the same day
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium cursor-default",
              "bg-purple-500/10 text-purple-500",
              variant === "floating" && "shadow-sm",
              className
            )}
          >
            <Plane className="w-3 h-3" />
            <span>{flights.length} vuelos</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm">
          <div className="space-y-2">
            <p className="font-medium">Vuelos del dia</p>
            {flights.map((flight) => {
              const typeConfig = flight.type ? FLIGHT_TYPE_CONFIG[flight.type] : FLIGHT_TYPE_CONFIG.outbound
              return (
                <div key={flight.id} className="flex items-center gap-2 text-sm">
                  <span className={typeConfig.textColor}>
                    {flight.origin} → {flight.destination}
                  </span>
                  <span className="text-muted-foreground">
                    {formatTime(flight.departureTime)}
                  </span>
                </div>
              )
            })}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Helper function to get flights for a specific date
export function getFlightsForDate(flights: FlightReservation[], date: string): FlightReservation[] {
  const targetDate = new Date(date).toISOString().split("T")[0]

  return flights.filter((flight) => {
    const departureDate = new Date(flight.date).toISOString().split("T")[0]
    const arrivalDate = flight.arrivalDate
      ? new Date(flight.arrivalDate).toISOString().split("T")[0]
      : departureDate

    // Flight shows on both departure and arrival dates
    return departureDate === targetDate || arrivalDate === targetDate
  })
}
