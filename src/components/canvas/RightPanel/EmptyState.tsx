"use client"

import { MapPin, Calendar, Users, Sparkles, Compass, Map } from "lucide-react"
import { parseLocalDate } from "@/lib/date-utils"
import type { GeneratedPlan } from "@/types/plan"

interface EmptyStateProps {
  plan: GeneratedPlan
}

export function EmptyState({ plan }: EmptyStateProps) {
  const totalActivities = plan.itinerary.reduce(
    (sum, day) => sum + day.timeline.length,
    0
  )
  const totalDays = plan.itinerary.length
  const daysWithActivities = plan.itinerary.filter(d => d.timeline.length > 0).length
  const daysToExplore = totalDays - daysWithActivities

  // Format date range
  const formatDateRange = () => {
    const start = parseLocalDate(plan.trip.startDate)
    const end = parseLocalDate(plan.trip.endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return ""
    return `${start.toLocaleDateString("es", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("es", { day: "numeric", month: "short" })}`
  }

  // Get contextual suggestions based on trip state
  const getSuggestions = () => {
    if (daysWithActivities === 0) {
      return [
        { icon: Compass, text: "Explora lugares populares", action: "explore" },
        { icon: Sparkles, text: "Genera un itinerario con AI", action: "generate" },
      ]
    }
    if (daysToExplore > 0) {
      return [
        { icon: Map, text: `${daysToExplore} días por planear`, action: "plan" },
        { icon: Sparkles, text: "Sugerencias para hoy", action: "suggest" },
      ]
    }
    return [
      { icon: Sparkles, text: "Optimizar rutas del viaje", action: "optimize" },
    ]
  }

  return (
    <div className="p-4 space-y-4">
      {/* Trip Header - Compact */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-transparent">
        <h3 className="text-base font-semibold text-foreground tracking-tight">
          {plan.summary.title || `Viaje a ${plan.trip.destination}`}
        </h3>

        {/* Trip Meta - Inline */}
        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {plan.trip.destination}
          </span>
          <span className="text-border">·</span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDateRange()}
          </span>
          {plan.trip.travelers > 1 && (
            <>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1">
                <Users className="w-3 h-3" />
                {plan.trip.travelers}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Progress - Positive Framing */}
      <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">{daysWithActivities}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {daysWithActivities === 0
                ? "Listo para comenzar"
                : daysWithActivities === totalDays
                  ? "Viaje completamente planeado"
                  : `${daysWithActivities} de ${totalDays} días planeados`
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {totalActivities > 0
                ? `${totalActivities} actividades agregadas`
                : "Agrega actividades para comenzar"
              }
            </p>
          </div>
        </div>

        {/* Subtle progress bar - thin and minimal with shimmer */}
        {daysWithActivities > 0 && daysWithActivities < totalDays && (
          <div className="mt-3 h-1.5 bg-muted/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-full transition-all duration-500 ease-out animate-pulse"
              style={{ width: `${(daysWithActivities / totalDays) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Contextual Suggestions */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
          Siguiente paso
        </h4>
        {getSuggestions().map((suggestion, i) => (
          <button
            key={i}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-200">
              <suggestion.icon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">{suggestion.text}</span>
            <svg className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* Quick Tips - More visual */}
      {plan.tips && plan.tips.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              {plan.tips[0]}
            </p>
          </div>
        </div>
      )}

      {/* Subtle hint */}
      <p className="text-xs text-muted-foreground/50 text-center pt-2">
        Haz clic en una actividad para ver detalles
      </p>
    </div>
  )
}
