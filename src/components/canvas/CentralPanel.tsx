"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useCanvasContext } from "./CanvasContext"
import { ViewModeToggle, type ViewMode } from "./ViewModeToggle"
import { ItineraryEditor } from "@/components/planning/editor"
import { ItineraryMapView } from "@/components/planning/editor/ItineraryMapView"
import { AccommodationsView } from "@/components/accommodations"
import { FlightsView } from "@/components/flights"
import type { GeneratedPlan, TimelineEntry } from "@/types/plan"
import type { DayGenerationState, DayGenerationStatus } from "@/hooks/useDayGeneration"

/**
 * Extract city name from a location string like "7av. Norte 18B, Antigua Guatemala"
 * Returns the last meaningful part (city) or the original string if parsing fails
 */
function extractCityFromLocation(location: string): string {
  if (!location) return location

  // Split by comma and get the last part
  const parts = location.split(',').map(p => p.trim())

  // If only one part, return as-is
  if (parts.length === 1) return location

  // Return the last part which is usually the city name
  // e.g., "7av. Norte 18B, Antigua Guatemala" → "Antigua Guatemala"
  return parts[parts.length - 1]
}

interface CentralPanelProps {
  tripId: string
  plan: GeneratedPlan
  onUpdatePlan: (plan: GeneratedPlan) => void
  // Streaming props
  dayGenerationStates?: Record<number, DayGenerationState>
  getDayStatus?: (dayNumber: number) => DayGenerationStatus
  getDayTimeline?: (dayNumber: number) => TimelineEntry[]
  onRegenerateDay?: (dayNumber: number) => Promise<void>
}

export function CentralPanel({
  tripId,
  plan,
  onUpdatePlan,
  dayGenerationStates,
  getDayStatus,
  getDayTimeline,
  onRegenerateDay,
}: CentralPanelProps) {
  const router = useRouter()
  const { selectActivity, selectAccommodation, registerDayRef } = useCanvasContext()
  const [viewMode, setViewMode] = useState<ViewMode>("timeline")

  // Handle add activity click - navigates to search page
  const handleAddActivityClick = useCallback((dayNumber: number) => {
    const day = plan.itinerary.find(d => d.day === dayNumber)
    // Get city from first activity location (extract from address) or use trip destination
    const rawLocation = day?.timeline[0]?.location
    const dayLocation = rawLocation ? extractCityFromLocation(rawLocation) : plan.trip.destination
    const params = new URLSearchParams({
      day: String(dayNumber),
      location: dayLocation,
      mode: 'add'
    })
    router.push(`/trips/${tripId}/search?${params}`)
  }, [plan.itinerary, plan.trip.destination, tripId, router])

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-end">
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      </div>

      {/* Conditional Content */}
      {viewMode === "timeline" && (
        <ItineraryEditor
          plan={plan}
          onUpdatePlan={onUpdatePlan}
          dayGenerationStates={dayGenerationStates}
          getDayStatus={getDayStatus}
          getDayTimeline={getDayTimeline}
          onActivityClick={selectActivity}
          onAddActivityClick={handleAddActivityClick}
          registerDayRef={registerDayRef}
          onRegenerateDay={onRegenerateDay}
          onAccommodationClick={selectAccommodation}
        />
      )}
      {viewMode === "map" && (
        <ItineraryMapView plan={plan} />
      )}
      {viewMode === "reservations" && (
        <AccommodationsView plan={plan} onUpdatePlan={onUpdatePlan} />
      )}
      {viewMode === "flights" && (
        <FlightsView plan={plan} onUpdatePlan={onUpdatePlan} />
      )}
    </div>
  )
}
