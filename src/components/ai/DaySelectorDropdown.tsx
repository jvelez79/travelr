/**
 * DaySelectorDropdown Component
 *
 * Dropdown menu for selecting which day to add a place to.
 * Includes option to add to Things To Do list (general list).
 * Similar to AddToDropdown but simplified for AI chat context.
 */

"use client"

import { Plus, Calendar, List, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { ItineraryDay } from "@/types/plan"

interface DaySelectorDropdownProps {
  days: ItineraryDay[]
  onSelectDay: (dayNumber: number) => Promise<void>
  onAddToThingsToDo: () => Promise<void>
  isLoading?: boolean
  className?: string
}

export function DaySelectorDropdown({
  days,
  onSelectDay,
  onAddToThingsToDo,
  isLoading = false,
  className,
}: DaySelectorDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center justify-center",
            "w-6 h-6 min-w-[24px] min-h-[24px]",
            "rounded-full",
            "bg-emerald-500/25 text-emerald-400",
            "hover:bg-emerald-500/40 hover:text-emerald-300",
            "active:scale-95",
            "transition-all ease-out duration-150 touch-manipulation",
            "focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:ring-offset-1 focus:ring-offset-slate-800",
            isLoading && "opacity-50 cursor-wait",
            className
          )}
          disabled={isLoading}
          aria-label="Agregar al itinerario"
          title="Agregar al itinerario"
          onClick={(e) => {
            // Prevent chip click event from firing
            e.stopPropagation()
          }}
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* Add to Things To Do */}
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onAddToThingsToDo()
          }}
          disabled={isLoading}
          className="gap-3 py-3 cursor-pointer"
        >
          <List className="w-4 h-4 text-primary" />
          <div className="flex flex-col">
            <span className="font-medium text-sm">Agregar a lista general</span>
            <span className="text-xs text-muted-foreground">
              Para decidir despues
            </span>
          </div>
        </DropdownMenuItem>

        {/* Add to specific day */}
        {days.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Agregar a dia especifico
            </div>
            <div className="max-h-[200px] overflow-y-auto overscroll-contain scroll-smooth">
              {days.map((day) => (
                <DropdownMenuItem
                  key={day.day}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectDay(day.day)
                  }}
                  disabled={isLoading}
                  className="gap-3 py-2.5 cursor-pointer"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {day.day}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {day.title || `Dia ${day.day}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {day.timeline.length} {day.timeline.length === 1 ? "actividad" : "actividades"}
                    </p>
                  </div>
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </DropdownMenuItem>
              ))}
            </div>
          </>
        )}

        {/* Empty state if no days */}
        {days.length === 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-3 py-2 text-xs text-muted-foreground text-center">
              Genera tu itinerario para agregar a dias especificos
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
