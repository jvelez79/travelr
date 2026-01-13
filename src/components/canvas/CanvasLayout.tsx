"use client"

import { useCallback, useState } from "react"
import { CanvasProvider } from "./CanvasContext"
import { CanvasDndProvider } from "./CanvasDndContext"
import { CanvasHeader } from "./CanvasHeader"
import { LeftSidebar } from "./LeftSidebar"
import { RightPanel } from "./RightPanel"
import { CentralPanel } from "./CentralPanel"
import { ExploreModal } from "@/components/explore/ExploreModal"
import { HotelSearchModal } from "@/components/hotels/HotelSearchModal"
import { ChatWidget } from "@/components/ai/ChatWidget"
import { useResponsiveLayout } from "./hooks/useResponsiveLayout"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useCanvasContext } from "./CanvasContext"
import { recalculateTimeline } from "@/lib/timeUtils"
import { calculateTransportForTimeline } from "@/lib/transportUtils"
import { calculateNights, createUserAccommodation } from "@/types/accommodation"
import type { GeneratedPlan, TimelineEntry, PlaceData } from "@/types/plan"
import type { DayGenerationState, DayGenerationStatus } from "@/hooks/useDayGeneration"
import type { Place, PlaceCategory } from "@/types/explore"
import type { HotelResult } from "@/lib/hotels/types"
import type { Accommodation } from "@/types/accommodation"
import type { ThingsToDoItem } from "@/hooks/useThingsToDo"
import type { PlaceChipData } from "@/types/ai-agent"
import { useAddToThingsToDo, useRemoveFromThingsToDo } from "@/hooks/useThingsToDo"

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

  // Hotel search modal state
  const [showHotelSearch, setShowHotelSearch] = useState(false)
  const [searchAccommodation, setSearchAccommodation] = useState<Accommodation | null>(null)

  // Trigger to refresh Things To Do list after drag operations
  const [thingsToDoRefreshTrigger, setThingsToDoRefreshTrigger] = useState(0)

  // Hooks for Things To Do management (for drag to Ideas)
  const { addItem: addToThingsToDo } = useAddToThingsToDo()
  const { removeItem: removeFromThingsToDo } = useRemoveFromThingsToDo()

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

  // Handle dropping a place chip from AI chat onto a day
  const handleDropPlaceChipOnDay = useCallback(async (placeId: string, placeData: PlaceChipData, dayNumber: number) => {
    // Convert PlaceChipData to TimelineEntry
    const newActivity: TimelineEntry = {
      id: `${placeId}-${Date.now()}`,
      time: "Por definir",
      activity: placeData.name,
      location: placeData.address || plan.trip.destination,
      icon: getIconForCategory((placeData.category as PlaceCategory) || 'attractions'),
      notes: placeData.description,
      placeId: placeId,
      placeData: {
        name: placeData.name,
        category: (placeData.category as PlaceCategory) || 'attractions',
        rating: placeData.rating,
        reviewCount: placeData.reviewCount,
        priceLevel: placeData.priceLevel,
        coordinates: placeData.location,
        address: placeData.address,
        images: placeData.imageUrl ? [placeData.imageUrl] : [],
        googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
      },
      matchConfidence: 'exact',
      durationMinutes: placeData.category === 'restaurant' || placeData.category === 'restaurants' ? 90 : 120,
    }

    // Update itinerary with recalculated timeline
    const updatedItinerary = plan.itinerary.map(d => {
      if (d.day !== dayNumber) return d
      const newTimeline = recalculateTimeline([...d.timeline, newActivity])
      return { ...d, timeline: newTimeline }
    })

    // Update plan immediately
    onUpdatePlan({ ...plan, itinerary: updatedItinerary })

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

  // Handle opening hotel search from RightPanel (for "Find Similar" button)
  const handleOpenHotelSearch = useCallback((accommodation?: Accommodation) => {
    setSearchAccommodation(accommodation || null)
    setShowHotelSearch(true)
  }, [])

  // Handle adding a Things To Do item to a specific day
  const handleAddThingsToDoToDay = useCallback(async (item: ThingsToDoItem, dayNumber: number) => {
    const { place_data, category } = item

    // Get icon based on category
    const categoryIconMap: Record<string, string> = {
      attractions: "🎯",
      food_drink: "🍽️",
      tours: "🗺️",
      activities: "🎯",
    }
    const icon = category ? categoryIconMap[category] || "🎯" : "🎯"

    const newActivity: TimelineEntry = {
      id: `ttd-${item.id}-${Date.now()}`,
      time: "Por definir",
      activity: place_data.name,
      location: place_data.formatted_address || plan.trip.destination,
      icon,
      notes: "",
      placeId: item.google_place_id,
      placeData: {
        name: place_data.name,
        category: (category as PlaceCategory) || 'attractions',
        rating: place_data.rating,
        reviewCount: place_data.user_ratings_total,
        coordinates: place_data.geometry?.location ?? { lat: 0, lng: 0 },
        address: place_data.formatted_address,
        images: place_data.photos?.map(p => p.photo_reference).filter(Boolean) || [],
        googleMapsUrl: `https://www.google.com/maps/place/?q=place_id:${item.google_place_id}`,
        openingHours: place_data.opening_hours?.weekday_text,
      },
      matchConfidence: 'exact',
      durationMinutes: category === 'food_drink' ? 90 : 120,
    }

    // Update itinerary with recalculated timeline
    const updatedItinerary = plan.itinerary.map(d => {
      if (d.day !== dayNumber) return d
      const newTimeline = recalculateTimeline([...d.timeline, newActivity])
      return { ...d, timeline: newTimeline }
    })

    // Update plan immediately
    onUpdatePlan({ ...plan, itinerary: updatedItinerary })

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

  // Handle moving activity between days (with time and insertion logic)
  const handleMoveActivity = useCallback(async (
    activityId: string,
    fromDay: number,
    toDay: number,
    newTime?: string,
    insertionIndex?: number
  ) => {
    const sourceDay = plan.itinerary.find(d => d.day === fromDay)
    const targetDay = plan.itinerary.find(d => d.day === toDay)

    if (!sourceDay || !targetDay) return

    const activity = sourceDay.timeline.find(a => a.id === activityId)
    if (!activity) return

    // Create the activity for the new day
    const movedActivity: TimelineEntry = {
      ...activity,
      time: newTime || "Por definir",
    }

    // Build the new timeline for the target day
    const targetTimeline = [...targetDay.timeline]
    const index = insertionIndex !== undefined ? insertionIndex : targetTimeline.length
    targetTimeline.splice(index, 0, movedActivity)

    // Update itinerary
    const updatedItinerary = plan.itinerary.map(d => {
      if (d.day === fromDay) {
        // Remove from source day
        const newTimeline = recalculateTimeline(d.timeline.filter(a => a.id !== activityId))
        return { ...d, timeline: newTimeline }
      }
      if (d.day === toDay) {
        // Add to target day (recalculate only if no specific time)
        const newTimeline = newTime ? targetTimeline : recalculateTimeline(targetTimeline)
        return { ...d, timeline: newTimeline }
      }
      return d
    })

    // Update plan immediately
    onUpdatePlan({ ...plan, itinerary: updatedItinerary })

    // Calculate transport for both affected days in background
    const daysToUpdate = [fromDay, toDay]
    for (const dayNum of daysToUpdate) {
      const dayToUpdate = updatedItinerary.find(d => d.day === dayNum)
      if (dayToUpdate && dayToUpdate.timeline.length >= 2) {
        try {
          const timelineWithTransport = await calculateTransportForTimeline(dayToUpdate.timeline)
          const finalItinerary = updatedItinerary.map(d =>
            d.day === dayNum ? { ...d, timeline: timelineWithTransport } : d
          )
          onUpdatePlan({ ...plan, itinerary: finalItinerary })
        } catch (error) {
          console.error('Error calculating transport:', error)
        }
      }
    }
  }, [plan, onUpdatePlan])

  // Handle dropping a saved idea onto a day (drag from Ideas to Day)
  const handleDropIdeaOnDay = useCallback(async (item: ThingsToDoItem, dayNumber: number) => {
    // First add to day (reuse existing logic)
    await handleAddThingsToDoToDay(item, dayNumber)

    // Then remove from Things To Do
    await removeFromThingsToDo(item.id)

    // Trigger refresh of Things To Do list
    setThingsToDoRefreshTrigger(prev => prev + 1)
  }, [handleAddThingsToDoToDay, removeFromThingsToDo])

  // Handle moving activity to Ideas (drag from Day to Ideas)
  const handleMoveActivityToIdeas = useCallback(async (activity: TimelineEntry, fromDay: number) => {
    // Only allow if activity has placeId
    if (!activity.placeId) return

    // Convert TimelineEntry to ThingsToDo item and save
    const placeData = {
      name: activity.activity,
      formatted_address: activity.placeData?.address,
      rating: activity.placeData?.rating,
      user_ratings_total: activity.placeData?.reviewCount,
      photos: activity.placeData?.images?.map(url => ({ photo_reference: url })),
      opening_hours: activity.placeData?.openingHours
        ? { weekday_text: activity.placeData.openingHours }
        : undefined,
      geometry: activity.placeData?.coordinates
        ? { location: activity.placeData.coordinates }
        : undefined,
    }

    // Determine category from placeData
    const categoryMap: Record<PlaceCategory, ThingsToDoItem['category']> = {
      restaurants: 'food_drink',
      cafes: 'food_drink',
      bars: 'food_drink',
      attractions: 'attractions',
      nature: 'activities',
      museums: 'attractions',
      landmarks: 'attractions',
      beaches: 'activities',
      religious: 'attractions',
      markets: 'attractions',
      viewpoints: 'activities',
      wellness: 'activities',
    }

    const category = activity.placeData?.category
      ? categoryMap[activity.placeData.category] || 'attractions'
      : 'attractions'

    // Add to Things To Do
    await addToThingsToDo({
      tripId: trip.id,
      googlePlaceId: activity.placeId,
      placeData,
      category,
    })

    // Remove from timeline
    const updatedItinerary = plan.itinerary.map(d => {
      if (d.day !== fromDay) return d
      const newTimeline = recalculateTimeline(d.timeline.filter(a => a.id !== activity.id))
      return { ...d, timeline: newTimeline }
    })

    onUpdatePlan({ ...plan, itinerary: updatedItinerary })

    // Trigger refresh of Things To Do list
    setThingsToDoRefreshTrigger(prev => prev + 1)

    // Recalculate transport for affected day
    const dayToUpdate = updatedItinerary.find(d => d.day === fromDay)
    if (dayToUpdate && dayToUpdate.timeline.length >= 2) {
      try {
        const timelineWithTransport = await calculateTransportForTimeline(dayToUpdate.timeline)
        const finalItinerary = updatedItinerary.map(d =>
          d.day === fromDay ? { ...d, timeline: timelineWithTransport } : d
        )
        onUpdatePlan({ ...plan, itinerary: finalItinerary })
      } catch (error) {
        console.error('Error calculating transport:', error)
      }
    }
  }, [plan, onUpdatePlan, trip.id, addToThingsToDo])

  // Handle adding a hotel from the search modal
  const handleHotelAddToPlan = useCallback((hotel: HotelResult) => {
    const checkIn = searchAccommodation?.checkIn || plan.trip.startDate
    const checkOut = searchAccommodation?.checkOut || plan.trip.endDate
    const nights = calculateNights(checkIn, checkOut)

    // Map hotel type to AccommodationType
    const typeMap: Record<string, Accommodation['type']> = {
      'Hotel': 'hotel',
      'Resort': 'resort',
      'Hostel': 'hostel',
      'Apartment': 'apartment',
      'Vacation rental': 'vacation_rental',
    }

    // Create unified Accommodation
    const newAccommodation = createUserAccommodation({
      name: hotel.name,
      type: typeMap[hotel.type] || 'hotel',
      area: hotel.location.area || plan.trip.destination,
      checkIn,
      checkOut,
      pricePerNight: hotel.price.perNight,
      totalPrice: hotel.price.total,
      currency: hotel.price.currency,
      bookingPlatform: hotel.bookingLinks[0]?.provider,
      bookingUrl: hotel.bookingLinks[0]?.url,
      source: 'hotel_search',
      status: 'pending',
    })

    // Add place data if available
    if (hotel.location.lat && hotel.location.lng) {
      newAccommodation.placeData = {
        name: hotel.name,
        coordinates: { lat: hotel.location.lat, lng: hotel.location.lng },
        address: hotel.location.address,
        rating: hotel.rating,
        reviewCount: hotel.reviewCount,
        images: hotel.images,
      }
    }

    // Add amenities and check-in/out times
    if (hotel.amenities) newAccommodation.amenities = hotel.amenities
    if (hotel.checkInTime) newAccommodation.checkInTime = hotel.checkInTime
    if (hotel.checkOutTime) newAccommodation.checkOutTime = hotel.checkOutTime

    // If replacing, remove the old accommodation
    let updated = plan.accommodations || []
    if (searchAccommodation && searchAccommodation.id) {
      updated = updated.filter(a => a.id !== searchAccommodation.id)
    }
    updated = [...updated, newAccommodation]

    // Update plan
    onUpdatePlan({
      ...plan,
      accommodations: updated,
    })

    // Close modal and clear state
    setShowHotelSearch(false)
    setSearchAccommodation(null)
  }, [plan, searchAccommodation, onUpdatePlan])

  return (
    <CanvasDndProvider
      onDropPlaceOnDay={handleDropPlaceOnDay}
      onDropPlaceChipOnDay={handleDropPlaceChipOnDay}
      onMoveActivity={handleMoveActivity}
      onDropIdeaOnDay={handleDropIdeaOnDay}
      onMoveActivityToIdeas={handleMoveActivityToIdeas}
      itinerary={plan.itinerary}
    >
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <CanvasHeader trip={trip} plan={plan} onStartOver={onStartOver} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Desktop: visible, Mobile/Tablet: Sheet */}
        {isDesktop ? (
          <aside className="w-60 border-r border-border/60 bg-card shrink-0 overflow-y-auto">
            <LeftSidebar
              plan={plan}
              tripId={trip.id}
              onAddThingsToDoToDay={handleAddThingsToDoToDay}
              thingsToDoRefreshTrigger={thingsToDoRefreshTrigger}
            />
          </aside>
        ) : (
          <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navegación del viaje</SheetTitle>
              <LeftSidebar
                plan={plan}
                tripId={trip.id}
                onAddThingsToDoToDay={handleAddThingsToDoToDay}
                thingsToDoRefreshTrigger={thingsToDoRefreshTrigger}
              />
            </SheetContent>
          </Sheet>
        )}

        {/* Central Panel - Always visible */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <div className="p-4 sm:p-6">
            <CentralPanel
              tripId={trip.id}
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
          <aside className="w-80 border-l border-border/60 bg-card shrink-0 overflow-y-auto">
            <RightPanel tripId={trip.id} plan={plan} onUpdatePlan={onUpdatePlan} onOpenHotelSearch={handleOpenHotelSearch} />
          </aside>
        )}

        {isTablet && (
          <aside className="w-72 border-l border-border/60 bg-card shrink-0 overflow-y-auto">
            <RightPanel tripId={trip.id} plan={plan} onUpdatePlan={onUpdatePlan} onOpenHotelSearch={handleOpenHotelSearch} />
          </aside>
        )}

        {isMobile && (
          <Sheet open={isRightPanelOpen} onOpenChange={setRightPanelOpen}>
            <SheetContent side="right" className="w-full sm:w-96 p-0">
              <SheetTitle className="sr-only">Detalles y búsqueda</SheetTitle>
              <RightPanel tripId={trip.id} plan={plan} onUpdatePlan={onUpdatePlan} onOpenHotelSearch={handleOpenHotelSearch} />
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

    {/* Hotel Search Modal - mounted at canvas level for "Find Similar" functionality */}
    <HotelSearchModal
      open={showHotelSearch}
      onOpenChange={(open) => {
        setShowHotelSearch(open)
        if (!open) setSearchAccommodation(null)
      }}
      destination={searchAccommodation?.placeData?.city || searchAccommodation?.area || plan.trip.destination}
      checkIn={searchAccommodation?.checkIn || plan.trip.startDate}
      checkOut={searchAccommodation?.checkOut || plan.trip.endDate}
      adults={plan.trip.travelers}
      onAddToPlan={handleHotelAddToPlan}
    />

    {/* AI Chat Widget - floating button with sheet */}
    <ChatWidget tripId={trip.id} />
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
