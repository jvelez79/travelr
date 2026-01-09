"use client"

import { useCanvasContext } from "../CanvasContext"
import { cn } from "@/lib/utils"
import { parseLocalDate } from "@/lib/date-utils"
import type { GeneratedPlan } from "@/types/plan"

interface DayNavigationProps {
  plan: GeneratedPlan
}

export function DayNavigation({ plan }: DayNavigationProps) {
  const { scrollToDay } = useCanvasContext()

  // Calculate trip progress - positive framing
  const totalActivities = plan.itinerary.reduce((sum, day) => sum + day.timeline.length, 0)
  const daysWithActivities = plan.itinerary.filter(day => day.timeline.length > 0).length
  const totalDays = plan.itinerary.length
  const daysToExplore = totalDays - daysWithActivities

  return (
    <div className="px-3 py-4">
      {/* Progress Header - Positive Framing */}
      <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">{daysWithActivities}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {daysWithActivities === 0
                ? "Comienza tu aventura"
                : daysWithActivities === totalDays
                  ? "Viaje completo"
                  : `${daysWithActivities} día${daysWithActivities > 1 ? 's' : ''} planeado${daysWithActivities > 1 ? 's' : ''}`
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {daysToExplore > 0
                ? `${daysToExplore} por descubrir · ${totalActivities} actividades`
                : `${totalActivities} actividades listas`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Mini Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
          <div key={d} className="text-[10px] font-medium text-muted-foreground/60 text-center py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid - Calendar Style */}
      <div className="grid grid-cols-7 gap-1">
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

          return (
            <button
              key={day.day}
              onClick={() => scrollToDay(day.day)}
              className={cn(
                "relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all duration-200",
                "hover:scale-105 hover:shadow-sm",
                hasActivities
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60",
                (isFirst || isLast) && !hasActivities && "ring-1 ring-inset ring-primary/30"
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
          <span className="text-[10px] text-muted-foreground">Llegada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-amber-500" />
          <span className="text-[10px] text-muted-foreground">Regreso</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-primary" />
          <span className="text-[10px] text-muted-foreground">Planeado</span>
        </div>
      </div>
    </div>
  )
}
