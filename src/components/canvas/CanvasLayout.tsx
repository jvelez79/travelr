"use client"

import { useCallback } from "react"
import { CanvasProvider } from "./CanvasContext"
import { CanvasDndProvider } from "./CanvasDndContext"
import { CanvasHeader } from "./CanvasHeader"
import { LeftSidebar } from "./LeftSidebar"
import { RightPanel } from "./RightPanel"
import { CentralPanel } from "./CentralPanel"
import { ExploreModal } from "@/components/explore/ExploreModal"
import { useResponsiveLayout } from "./hooks/useResponsiveLayout"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useCanvasContext } from "./CanvasContext"
import { recalculateTimeline } from "@/lib/timeUtils"
import { calculateTransportForTimeline } from "@/lib/transportUtils"
import type { GeneratedPlan, TimelineEntry, PlaceData, ItineraryDay } from "@/types/plan"
import type { DayGenerationState, DayGenerationStatus } from "@/hooks/useDayGeneration"
import type { Place, PlaceCategory } from "@/types/explore"

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
  return parts[parts.length - 1]
}

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
    images: place.images?.slice(0, 10),
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
    landmarks: "🗿",
    beaches: "🏖️",
    religious: "⛪",
    markets: "🛒",
    viewpoints: "🏔️",
    wellness: "🧘",
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
  const {
    isSidebarOpen,
    setSidebarOpen,
    isRightPanelOpen,
    setRightPanelOpen,
    exploreModalState,
    closeExploreModal,
    clearRightPanel,
    openCustomActivityEditor,
  } = useCanvasContext()
  const { isDesktop, isMobile, isTablet } = useResponsiveLayout()

  // Get available days for the modal - extract city from location address
  const availableDays = plan.itinerary.map(d => {
    const rawLocation = d.timeline[0]?.location
    return {
      number: d.day,
      location: rawLocation ? extractCityFromLocation(rawLocation) : plan.trip.destination,
    }
  })

  // Get accommodation for the current day in the explore modal
  const dayAccommodation = (() => {
    if (!exploreModalState?.dayNumber || !plan.accommodations?.length) {
      return undefined
    }

    const dayNumber = exploreModalState.dayNumber
    const tripStartDate = new Date(plan.trip.startDate)
    const currentDayDate = new Date(tripStartDate)
    currentDayDate.setDate(tripStartDate.getDate() + dayNumber - 1)

    // Find accommodation that covers this day (between checkIn and checkOut)
    for (const acc of plan.accommodations) {
      if (!acc.placeData?.coordinates?.lat || !acc.placeData?.coordinates?.lng) continue

      const checkIn = new Date(acc.checkIn)
      const checkOut = new Date(acc.checkOut)

      // Check if current day is within stay period
      if (currentDayDate >= checkIn && currentDayDate < checkOut) {
        return {
          name: acc.name,
          location: {
            lat: acc.placeData.coordinates.lat,
            lng: acc.placeData.coordinates.lng,
          },
        }
      }
    }

    return undefined
  })()

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

  // Handle adding/linking a place from the ExploreModal
  const handleAddPlaceFromModal = useCallback(async (place: Place, dayNumber: number) => {
    if (!exploreModalState) return

    const day = plan.itinerary.find(d => d.day === dayNumber)
    if (!day) return

    let updatedItinerary

    if (exploreModalState.mode === 'replace' && exploreModalState.replaceActivityId) {
      // Replace/Link mode: Update existing activity
      const activityToReplace = day.timeline.find(a => a.id === exploreModalState.replaceActivityId)

      const linkedActivity: TimelineEntry = {
        ...activityToReplace,
        id: activityToReplace?.id || `${place.id}-${Date.now()}`,
        // Keep original time and duration
        time: activityToReplace?.time || "Por definir",
        durationMinutes: activityToReplace?.durationMinutes || (place.category === 'restaurants' ? 90 : 120),
        // Replace name and add place data
        activity: place.name,
        location: place.location.city || exploreModalState.dayLocation,
        icon: getIconForCategory(place.category),
        notes: place.description,
        placeId: place.id,
        placeData: placeToPlaceData(place),
        matchConfidence: 'exact',
      }

      updatedItinerary = plan.itinerary.map(d => {
        if (d.day !== dayNumber) return d
        const newTimeline = d.timeline.map(a =>
          a.id === exploreModalState.replaceActivityId ? linkedActivity : a
        )
        return { ...d, timeline: newTimeline }
      })
    } else {
      // Add mode: Create new activity
      const newActivity: TimelineEntry = {
        id: `${place.id}-${Date.now()}`,
        time: "Por definir",
        activity: place.name,
        location: place.location.city || exploreModalState.dayLocation,
        icon: getIconForCategory(place.category),
        notes: place.description,
        placeId: place.id,
        placeData: placeToPlaceData(place),
        matchConfidence: 'exact',
        durationMinutes: place.category === 'restaurants' ? 90 : 120,
      }

      updatedItinerary = plan.itinerary.map(d => {
        if (d.day !== dayNumber) return d
        const newTimeline = recalculateTimeline([...d.timeline, newActivity])
        return { ...d, timeline: newTimeline }
      })
    }

    // Update plan immediately
    onUpdatePlan({ ...plan, itinerary: updatedItinerary })

    // Close modal and clear right panel
    closeExploreModal()
    clearRightPanel()

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
  }, [exploreModalState, plan, onUpdatePlan, closeExploreModal, clearRightPanel])

  return (
    <CanvasDndProvider onDropPlaceOnDay={handleDropPlaceOnDay}>
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <CanvasHeader trip={trip} plan={plan} onStartOver={onStartOver} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Desktop: visible, Mobile/Tablet: Sheet */}
        {isDesktop ? (
          <aside className="w-60 border-r border-border bg-card shrink-0 overflow-y-auto">
            <LeftSidebar plan={plan} />
          </aside>
        ) : (
          <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navegación del viaje</SheetTitle>
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
              <SheetTitle className="sr-only">Detalles y búsqueda</SheetTitle>
              <RightPanel plan={plan} onUpdatePlan={onUpdatePlan} />
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>

    {/* Explore Modal - mounted at canvas level for global access */}
    {/* Places are now fetched internally by ExploreModal with dynamic geocoding */}
    {exploreModalState && (
      <ExploreModal
        isOpen={exploreModalState.isOpen}
        onClose={closeExploreModal}
        dayNumber={exploreModalState.dayNumber}
        dayLocation={exploreModalState.dayLocation}
        tripDestination={plan.trip.destination}
        mode={exploreModalState.mode}
        activityName={exploreModalState.activityName}
        onAddPlace={handleAddPlaceFromModal}
        initialCategory={exploreModalState.preselectedCategory}
        availableDays={availableDays}
        dayAccommodation={dayAccommodation}
        onCreateCustomActivity={openCustomActivityEditor}
      />
    )}
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
