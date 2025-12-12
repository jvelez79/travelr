"use client"

import { useCallback } from "react"
import { CanvasProvider } from "./CanvasContext"
import { CanvasDndProvider } from "./CanvasDndContext"
import { CanvasHeader } from "./CanvasHeader"
import { LeftSidebar } from "./LeftSidebar"
import { RightPanel } from "./RightPanel"
import { CentralPanel } from "./CentralPanel"
import { useResponsiveLayout } from "./hooks/useResponsiveLayout"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useCanvasContext } from "./CanvasContext"
import { recalculateTimeline } from "@/lib/timeUtils"
import { calculateTransportForTimeline } from "@/lib/transportUtils"
import type { GeneratedPlan, TimelineEntry, PlaceData } from "@/types/plan"
import type { DayGenerationState, DayGenerationStatus } from "@/hooks/useDayGeneration"
import type { Place, PlaceCategory } from "@/types/explore"

interface Trip {
  id: string
  destination: string
  origin: string
  startDate: string
  endDate: string
  travelers: number
}

interface CanvasLayoutProps {
  trip: Trip
  plan: GeneratedPlan
  onUpdatePlan: (plan: GeneratedPlan) => void
  onStartOver: () => void
  // Streaming props
  dayGenerationStates?: Record<number, DayGenerationState>
  getDayStatus?: (dayNumber: number) => DayGenerationStatus
  getDayTimeline?: (dayNumber: number) => TimelineEntry[]
  onRegenerateDay?: (dayNumber: number) => Promise<void>
}

// Helper to convert Place to PlaceData
function placeToPlaceData(place: Place): PlaceData {
  return {
    name: place.name,
    category: place.category,
    rating: place.rating,
    reviewCount: place.reviewCount,
    priceLevel: place.priceLevel,
    coordinates: {
      lat: place.location.lat,
      lng: place.location.lng,
    },
    address: place.location.address,
    images: place.images?.slice(0, 2),
    googleMapsUrl: place.googleMapsUrl || `https://www.google.com/maps/place/?q=place_id:${place.id}`,
    phone: place.phone,
    website: place.website,
    openingHours: place.openingHours,
  }
}

// Get icon for category
function getIconForCategory(category: PlaceCategory): string {
  const icons: Record<PlaceCategory, string> = {
    attractions: "🎯",
    nature: "🌋",
    restaurants: "🍽️",
    cafes: "☕",
    bars: "🍺",
    museums: "🎭",
  }
  return icons[category] || "🎯"
}

// Inner component that uses context
function CanvasLayoutInner({
  trip,
  plan,
  onUpdatePlan,
  onStartOver,
  dayGenerationStates,
  getDayStatus,
  getDayTimeline,
  onRegenerateDay,
}: CanvasLayoutProps) {
  const { isSidebarOpen, setSidebarOpen, isRightPanelOpen, setRightPanelOpen } = useCanvasContext()
  const { isDesktop, isMobile, isTablet } = useResponsiveLayout()

  // Handle dropping a place from PlaceSearch onto a day
  const handleDropPlaceOnDay = useCallback(async (place: Place, dayNumber: number) => {
    const newActivity: TimelineEntry = {
      id: `${place.id}-${Date.now()}`,
      time: "Por definir",
      activity: place.name,
      location: place.location.city || plan.trip.destination,
      icon: getIconForCategory(place.category),
      notes: place.description,
      placeId: place.id,
      placeData: placeToPlaceData(place),
      matchConfidence: 'exact',
      durationMinutes: place.category === 'restaurants' ? 90 : 120,
    }

    // Update itinerary with recalculated timeline
    const updatedItinerary = plan.itinerary.map(d => {
      if (d.day !== dayNumber) return d
      const newTimeline = recalculateTimeline([...d.timeline, newActivity])
      return { ...d, timeline: newTimeline }
    })

    // Update plan immediately
    onUpdatePlan({ ...plan, itinerary: updatedItinerary })

    // Don't close right panel - allow adding more activities

    // Calculate transport in background
    const dayToUpdate = updatedItinerary.find(d => d.day === dayNumber)
    if (dayToUpdate && dayToUpdate.timeline.length >= 2) {
      try {
        const timelineWithTransport = await calculateTransportForTimeline(dayToUpdate.timeline)
        const finalItinerary = updatedItinerary.map(d =>
          d.day === dayNumber ? { ...d, timeline: timelineWithTransport } : d
        )
        onUpdatePlan({ ...plan, itinerary: finalItinerary })
      } catch (error) {
        console.error('Error calculating transport:', error)
      }
    }
  }, [plan, onUpdatePlan])

  return (
    <CanvasDndProvider onDropPlaceOnDay={handleDropPlaceOnDay}>
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <CanvasHeader trip={trip} onStartOver={onStartOver} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Desktop: visible, Mobile/Tablet: Sheet */}
        {isDesktop ? (
          <aside className="w-60 border-r border-border bg-card shrink-0 overflow-y-auto">
            <LeftSidebar plan={plan} />
          </aside>
        ) : (
          <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-72 p-0">
              <LeftSidebar plan={plan} />
            </SheetContent>
          </Sheet>
        )}

        {/* Central Panel - Always visible */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="p-4 sm:p-6">
            <CentralPanel
              plan={plan}
              onUpdatePlan={onUpdatePlan}
              dayGenerationStates={dayGenerationStates}
              getDayStatus={getDayStatus}
              getDayTimeline={getDayTimeline}
              onRegenerateDay={onRegenerateDay}
            />
          </div>
        </main>

        {/* Right Panel - Desktop: visible, Tablet: visible, Mobile: Sheet */}
        {isDesktop && (
          <aside className="w-80 border-l border-border bg-card shrink-0 overflow-y-auto">
            <RightPanel plan={plan} onUpdatePlan={onUpdatePlan} />
          </aside>
        )}

        {isTablet && (
          <aside className="w-72 border-l border-border bg-card shrink-0 overflow-y-auto">
            <RightPanel plan={plan} onUpdatePlan={onUpdatePlan} />
          </aside>
        )}

        {isMobile && (
          <Sheet open={isRightPanelOpen} onOpenChange={setRightPanelOpen}>
            <SheetContent side="right" className="w-full sm:w-96 p-0">
              <RightPanel plan={plan} onUpdatePlan={onUpdatePlan} />
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
    </CanvasDndProvider>
  )
}

// Wrapper that provides context
export function CanvasLayout(props: CanvasLayoutProps) {
  return (
    <CanvasProvider>
      <CanvasLayoutInner {...props} />
    </CanvasProvider>
  )
}
