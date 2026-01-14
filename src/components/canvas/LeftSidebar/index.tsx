"use client"

import { Search } from "lucide-react"
import { DayNavigation } from "./DayNavigation"
import { QuickActions } from "./QuickActions"
import { ThingsToDoSection } from "./ThingsToDoSection"
import { useCanvasContext } from "../CanvasContext"
import type { GeneratedPlan } from "@/types/plan"
import type { ThingsToDoItem } from "@/hooks/useThingsToDo"

interface LeftSidebarProps {
  plan: GeneratedPlan
  onUpdatePlan?: (plan: GeneratedPlan) => void
  tripId?: string
  onAddThingsToDoToDay?: (item: ThingsToDoItem, dayNumber: number) => void
  thingsToDoRefreshTrigger?: number
}

export function LeftSidebar({ plan, onUpdatePlan, tripId, onAddThingsToDoToDay, thingsToDoRefreshTrigger }: LeftSidebarProps) {
  const { openSearch } = useCanvasContext()

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <DayNavigation plan={plan} />
      <QuickActions plan={plan} onUpdatePlan={onUpdatePlan} />

      {/* Search Button */}
      <div className="px-3 pb-3">
        <button
          onClick={() => openSearch(null)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 border-2 border-dashed border-primary/20 hover:border-primary/40 transition-all duration-200 group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-all duration-200">
            <Search className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-sm font-semibold text-foreground block">Buscar lugares</span>
            <span className="text-xs text-muted-foreground">Encuentra actividades cerca</span>
          </div>
        </button>
      </div>

      {tripId && onAddThingsToDoToDay && (
        <ThingsToDoSection
          tripId={tripId}
          plan={plan}
          onAddToDay={onAddThingsToDoToDay}
          refreshTrigger={thingsToDoRefreshTrigger}
        />
      )}
    </div>
  )
}
