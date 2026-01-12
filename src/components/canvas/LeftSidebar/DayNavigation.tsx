"use client"

import { useCanvasContext } from "../CanvasContext"
import { cn } from "@/lib/utils"
import { parseLocalDate } from "@/lib/date-utils"
import type { GeneratedPlan } from "@/types/plan"

interface DayNavigationProps {
  plan: GeneratedPlan
}

export function DayNavigation({ plan }: DayNavigationProps) {
  const { scrollToDay, focusedDayNumber } = useCanvasContext()

  // Calculate trip progress - positive framing
  const totalActivities = plan.itinerary.reduce((sum, day) => sum + day.timeline.length, 0)
  const daysWithActivities = plan.itinerary.filter(day => day.timeline.length > 0).length
  const totalDays = plan.itinerary.length
  const daysToExplore = totalDays - daysWithActivities

  return (
    <div className="px-3 py-4">
      {/* Progress Header - Compact with Progress Ring */}
      <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
        <div className="flex items-center gap-3">
          {/* Progress Ring */}
          <div className="relative w-12 h-12 flex-shrink-0">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-muted/30"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${(daysWithActivities / totalDays) * 94.2} 94.2`}
                strokeLinecap="round"
                className="text-primary transition-all duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary">
              {daysWithActivities}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {daysWithActivities === 0
                ? "Comienza tu aventura"
                : daysWithActivities === totalDays
                  ? "¡Viaje completo!"
                  : `${daysWithActivities} de ${totalDays} días`
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {daysToExplore > 0
                ? `${daysToExplore} por descubrir`
                : `${totalActivities} actividades`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Mini Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
          <div key={d} className="text-[10px] font-semibold text-muted-foreground/70 text-center py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid - Calendar Style */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Empty cells for first week alignment */}
        {(() => {
          const firstDate = parseLocalDate(plan.itinerary[0]?.date)
          const firstDayOfWeek = !isNaN(firstDate.getTime()) ? firstDate.getDay() : 0
          const emptyBefore = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
          return Array.from({ length: emptyBefore }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))
        })()}

        {plan.itinerary.map((day, index) => {
          const activityCount = day.timeline.length
          const date = parseLocalDate(day.date)
          const isValidDate = !isNaN(date.getTime())
          const dayNum = isValidDate ? date.getDate() : day.day
          const hasActivities = activityCount > 0
          const isFirst = index === 0
          const isLast = index === plan.itinerary.length - 1
          const isFocused = focusedDayNumber === day.day

          return (
            <button
              key={day.day}
              onClick={() => scrollToDay(day.day)}
              className={cn(
                "relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all duration-200",
                "hover:scale-105 hover:shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-card",
                hasActivities
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60",
                (isFirst || isLast) && !hasActivities && "ring-1 ring-inset ring-primary/30",
                // Focused day indicator - ring around the day
                isFocused && "ring-2 ring-offset-1 ring-offset-card ring-primary scale-110 shadow-md"
              )}
              title={`${activityCount} actividades`}
            >
              <span className={cn(
                "text-xs font-semibold tabular-nums",
                hasActivities ? "text-primary-foreground" : "text-foreground"
              )}>
                {dayNum}
              </span>
              {/* Activity dots indicator */}
              {activityCount > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: Math.min(activityCount, 3) }).map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-primary-foreground/80" />
                  ))}
                </div>
              )}
              {/* First/Last day indicator */}
              {(isFirst || isLast) && (
                <div className={cn(
                  "absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center",
                  isFirst ? "bg-emerald-500" : "bg-amber-500"
                )}>
                  <span className="text-[8px] text-white font-bold">
                    {isFirst ? "→" : "←"}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border/30">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
          <span className="text-xs text-muted-foreground">Llegada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-amber-500" />
          <span className="text-xs text-muted-foreground">Regreso</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-primary" />
          <span className="text-xs text-muted-foreground">Planeado</span>
        </div>
      </div>
    </div>
  )
}
