"use client"

import { useCanvasContext } from "../CanvasContext"
import { cn } from "@/lib/utils"
import type { GeneratedPlan } from "@/types/plan"

interface DayNavigationProps {
  plan: GeneratedPlan
}

export function DayNavigation({ plan }: DayNavigationProps) {
  const { scrollToDay } = useCanvasContext()

  return (
    <div className="px-3 py-4 border-y border-border/40">
      <h3 className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-widest mb-2 px-2">
        Itinerario
      </h3>
      <nav className="space-y-0.5">
        {plan.itinerary.map((day) => {
          const activityCount = day.timeline.length
          const date = new Date(day.date)
          const dayOfWeek = !isNaN(date.getTime())
            ? date.toLocaleDateString("es", { weekday: "short" })
            : ""
          const dayNum = !isNaN(date.getTime())
            ? date.getDate()
            : day.day
          const hasActivities = activityCount > 0

          return (
            <button
              key={day.day}
              onClick={() => scrollToDay(day.day)}
              className={cn(
                "group w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left transition-colors",
                "hover:bg-muted/50 active:bg-muted/70"
              )}
            >
              {/* Day Badge - Compact */}
              <div className={cn(
                "w-9 h-9 rounded-md flex flex-col items-center justify-center shrink-0",
                "text-[10px] leading-tight",
                hasActivities
                  ? "bg-primary/10 text-primary"
                  : "bg-muted/50 text-muted-foreground"
              )}>
                <span className="font-semibold text-sm tabular-nums">{dayNum}</span>
                <span className="capitalize text-[9px] opacity-70">{dayOfWeek}</span>
              </div>

              {/* Day Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-foreground truncate leading-tight">
                  {day.title}
                </div>
                {hasActivities ? (
                  <div className="text-[11px] text-primary/70 mt-0.5">
                    {activityCount} {activityCount === 1 ? 'actividad' : 'actividades'}
                  </div>
                ) : (
                  <div className="text-[11px] text-muted-foreground/50 mt-0.5">
                    Sin actividades
                  </div>
                )}
              </div>

              {/* Activity Count Badge */}
              {/* {hasActivities && (
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                  <span className="text-[10px] font-medium text-primary">{activityCount}</span>
                </div>
              )} */}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
