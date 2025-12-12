"use client"

import { useState } from "react"
import { useCanvasContext } from "./CanvasContext"
import { ViewModeToggle, type ViewMode } from "./ViewModeToggle"
import { ItineraryEditor } from "@/components/planning/editor"
import { ItineraryMapView } from "@/components/planning/editor/ItineraryMapView"
import type { GeneratedPlan, TimelineEntry } from "@/types/plan"
import type { DayGenerationState, DayGenerationStatus } from "@/hooks/useDayGeneration"

interface CentralPanelProps {
  plan: GeneratedPlan
  onUpdatePlan: (plan: GeneratedPlan) => void
  // Streaming props
  dayGenerationStates?: Record<number, DayGenerationState>
  getDayStatus?: (dayNumber: number) => DayGenerationStatus
  getDayTimeline?: (dayNumber: number) => TimelineEntry[]
  onRegenerateDay?: (dayNumber: number) => Promise<void>
}

export function CentralPanel({
  plan,
  onUpdatePlan,
  dayGenerationStates,
  getDayStatus,
  getDayTimeline,
  onRegenerateDay,
}: CentralPanelProps) {
  const { selectActivity, openSearch, registerDayRef } = useCanvasContext()
  const [viewMode, setViewMode] = useState<ViewMode>("timeline")

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-end">
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      </div>

      {/* Conditional Content */}
      {viewMode === "timeline" ? (
        <ItineraryEditor
          plan={plan}
          onUpdatePlan={onUpdatePlan}
          dayGenerationStates={dayGenerationStates}
          getDayStatus={getDayStatus}
          getDayTimeline={getDayTimeline}
          onActivityClick={selectActivity}
          onAddActivityClick={openSearch}
          registerDayRef={registerDayRef}
          onRegenerateDay={onRegenerateDay}
        />
      ) : (
        <ItineraryMapView plan={plan} />
      )}
    </div>
  )
}
