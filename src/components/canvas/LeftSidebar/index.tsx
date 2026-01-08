"use client"

import { DayNavigation } from "./DayNavigation"
import { QuickActions } from "./QuickActions"
import { ThingsToDoSection } from "./ThingsToDoSection"
import type { GeneratedPlan } from "@/types/plan"
import type { ThingsToDoItem } from "@/hooks/useThingsToDo"

interface LeftSidebarProps {
  plan: GeneratedPlan
  onUpdatePlan?: (plan: GeneratedPlan) => void
  tripId?: string
  onAddThingsToDoToDay?: (item: ThingsToDoItem, dayNumber: number) => void
}

export function LeftSidebar({ plan, onUpdatePlan, tripId, onAddThingsToDoToDay }: LeftSidebarProps) {
  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <DayNavigation plan={plan} />
      <QuickActions plan={plan} onUpdatePlan={onUpdatePlan} />
      {tripId && onAddThingsToDoToDay && (
        <ThingsToDoSection
          tripId={tripId}
          plan={plan}
          onAddToDay={onAddThingsToDoToDay}
        />
      )}
    </div>
  )
}
