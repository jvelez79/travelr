"use client"

import { useMemo } from "react"
import { DayEditor } from "./DayEditor"
import { getAccommodationForDay } from "@/lib/accommodation/utils"
import type { GeneratedPlan, ItineraryDay, TimelineEntry, AccommodationSuggestion } from "@/types/plan"
import type { DayGenerationState, DayGenerationStatus } from "@/hooks/useDayGeneration"

interface ItineraryEditorProps {
  plan: GeneratedPlan
  onUpdatePlan: (plan: GeneratedPlan) => void
  // Streaming props
  dayGenerationStates?: Record<number, DayGenerationState>
  getDayStatus?: (dayNumber: number) => DayGenerationStatus
  getDayTimeline?: (dayNumber: number) => TimelineEntry[]
  // Canvas integration
  onActivityClick?: (activity: TimelineEntry, dayNumber: number) => void
  onAddActivityClick?: (dayNumber: number) => void
  registerDayRef?: (dayNumber: number, ref: HTMLDivElement | null) => void
  onRegenerateDay?: (dayNumber: number) => Promise<void>
  // Accommodation integration
  onAccommodationClick?: (accommodation: AccommodationSuggestion) => void
}

export function ItineraryEditor({
  plan,
  onUpdatePlan,
  dayGenerationStates,
  getDayStatus,
  getDayTimeline,
  onActivityClick,
  onAddActivityClick,
  registerDayRef,
  onRegenerateDay,
  onAccommodationClick,
}: ItineraryEditorProps) {
  // Get accommodation suggestions from plan
  const accommodationSuggestions = useMemo(() => {
    return plan.accommodation?.suggestions || []
  }, [plan.accommodation?.suggestions])

  // Update a single day
  const updateDay = (dayNumber: number, updatedDay: ItineraryDay) => {
    const updatedItinerary = plan.itinerary.map((day) =>
      day.day === dayNumber ? updatedDay : day
    )

    onUpdatePlan({
      ...plan,
      itinerary: updatedItinerary,
      updatedAt: new Date().toISOString(),
      version: plan.version + 1,
    })
  }

  return (
    <div className="space-y-5">
      {/* Days */}
      {plan.itinerary.map((day) => {
        const dayStatus = getDayStatus?.(day.day) || 'completed'
        const streamingTimeline = getDayTimeline?.(day.day) || []
        const isGenerating = dayStatus === 'generating'

        // Get the accommodation for this day (where user stayed the night before)
        const dayAccommodation = getAccommodationForDay(
          day.date,
          day.day,
          accommodationSuggestions
        )

        return (
          <DayEditor
            key={day.day}
            day={day}
            onUpdateDay={(updatedDay) => updateDay(day.day, updatedDay)}
            generationStatus={dayStatus}
            streamingTimeline={streamingTimeline}
            isGenerating={isGenerating}
            onActivityClick={onActivityClick ? (activity) => onActivityClick(activity, day.day) : undefined}
            onAddActivityClick={onAddActivityClick ? () => onAddActivityClick(day.day) : undefined}
            registerRef={registerDayRef ? (ref) => registerDayRef(day.day, ref) : undefined}
            onRegenerate={onRegenerateDay ? () => onRegenerateDay(day.day) : undefined}
            accommodation={dayAccommodation}
            onAccommodationClick={onAccommodationClick}
          />
        )
      })}
    </div>
  )
}
