"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import Image from "next/image"
import { Compass } from "lucide-react"
import type { Place } from "@/types/explore"
import type { TimelineEntry, ItineraryDay } from "@/types/plan"
import type { ThingsToDoItem } from "@/hooks/useThingsToDo"

// Drag data types - extended with saved-idea
// type DragItemType = "place" | "timeline-activity" | "saved-idea" // Currently unused but documents valid types

interface PlaceDragData {
  type: "place"
  place: Place
}

interface TimelineActivityDragData {
  type: "timeline-activity"
  activity: TimelineEntry
  dayNumber: number
}

interface SavedIdeaDragData {
  type: "saved-idea"
  item: ThingsToDoItem
}

type DragData = PlaceDragData | TimelineActivityDragData | SavedIdeaDragData

// Context for accessing drag state
interface CanvasDndContextValue {
  activeItem: DragData | null
  isDraggingPlace: boolean
  isDraggingSavedIdea: boolean
  isDraggingActivity: boolean
  canDropToIdeas: boolean // Whether the dragged item can be dropped to Ideas
  isDesktop: boolean // Whether drag is enabled (desktop only)
}

const CanvasDndReactContext = createContext<CanvasDndContextValue | null>(null)

export function useCanvasDnd() {
  const context = useContext(CanvasDndReactContext)
  if (!context) {
    throw new Error("useCanvasDnd must be used within CanvasDndProvider")
  }
  return context
}

// Time utilities for schedule logic
function timeToMinutes(time: string): number {
  if (!time || time === "Por definir") return -1

  // Parse time like "10:00 AM" or "2:30 PM"
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!match) return -1

  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const period = match[3]?.toUpperCase()

  if (period === "PM" && hours !== 12) hours += 12
  if (period === "AM" && hours === 12) hours = 0

  return hours * 60 + minutes
}

function calculateNewTime(
  activity: TimelineEntry,
  targetDay: ItineraryDay
): string | null {
  const originalTime = activity.time

  // If the activity doesn't have a time (comes from Ideas), return null (insert at end)
  if (!originalTime || originalTime === "Por definir") return null

  // Check if there's a conflict in the target day
  const hasConflict = targetDay.timeline.some(entry =>
    entry.time === originalTime
  )

  // If no conflict, keep original time
  if (!hasConflict) return originalTime

  // If there's a conflict, return null to insert at end
  return null
}

function getInsertionIndex(
  timeline: TimelineEntry[],
  newTime: string | null
): number {
  // If no time, insert at end
  if (!newTime) return timeline.length

  const newMinutes = timeToMinutes(newTime)
  if (newMinutes < 0) return timeline.length

  // Insert in chronological position
  for (let i = 0; i < timeline.length; i++) {
    const entryMinutes = timeToMinutes(timeline[i].time)
    if (entryMinutes > newMinutes) {
      return i
    }
  }

  return timeline.length
}

// Check if an activity can be dropped to Ideas (must have placeId)
function canActivityDropToIdeas(activity: TimelineEntry): boolean {
  return !!activity.placeId
}

// Event handlers passed from parent
interface CanvasDndProviderProps {
  children: ReactNode
  onDropPlaceOnDay?: (place: Place, dayNumber: number, dropY?: number) => void
  onMoveActivity?: (activityId: string, fromDay: number, toDay: number, newTime?: string, insertionIndex?: number) => void
  onDropIdeaOnDay?: (item: ThingsToDoItem, dayNumber: number) => void
  onMoveActivityToIdeas?: (activity: TimelineEntry, fromDay: number) => void
  itinerary?: ItineraryDay[] // Needed for time calculation
}

export function CanvasDndProvider({
  children,
  onDropPlaceOnDay,
  onMoveActivity,
  onDropIdeaOnDay,
  onMoveActivityToIdeas,
  itinerary = [],
}: CanvasDndProviderProps) {
  const [activeItem, setActiveItem] = useState<DragData | null>(null)
  const [isDesktop, setIsDesktop] = useState(true) // Default to true for SSR

  // Detect desktop vs mobile/tablet (drag only enabled on >= 1024px)
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  // Declare sensors separately to maintain consistent hook order
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // Slightly higher to avoid accidental drags
    },
  })

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200, // Wait 200ms before activating to avoid accidental touch triggers
      tolerance: 8, // Allow 8px movement during delay
    },
  })

  // Only enable sensors on desktop
  const sensors = useSensors(
    isDesktop ? pointerSensor : null,
    isDesktop ? touchSensor : null
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (!isDesktop) return // Prevent drag on mobile

    const { active } = event
    const data = active.data.current as DragData | undefined

    if (data) {
      setActiveItem(data)
    }
  }, [isDesktop])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { over } = event

    if (!over || !activeItem) {
      setActiveItem(null)
      return
    }

    const overData = over.data.current as { type: string; dayNumber?: number } | undefined

    // Handle dropping a place onto a day
    if (activeItem.type === "place" && overData?.type === "day-drop-zone") {
      const dayNumber = overData.dayNumber
      if (dayNumber && onDropPlaceOnDay) {
        onDropPlaceOnDay(activeItem.place, dayNumber)
      }
    }

    // Handle dropping a saved idea onto a day
    if (activeItem.type === "saved-idea" && overData?.type === "day-drop-zone") {
      const dayNumber = overData.dayNumber
      if (dayNumber && onDropIdeaOnDay) {
        onDropIdeaOnDay(activeItem.item, dayNumber)
      }
    }

    // Handle moving activity between days
    if (activeItem.type === "timeline-activity" && overData?.type === "day-drop-zone") {
      const toDayNumber = overData.dayNumber
      if (toDayNumber && onMoveActivity && activeItem.dayNumber !== toDayNumber) {
        // Find the target day to calculate new time and insertion index
        const targetDay = itinerary.find(d => d.day === toDayNumber)
        if (targetDay) {
          const newTime = calculateNewTime(activeItem.activity, targetDay)
          const insertionIndex = getInsertionIndex(targetDay.timeline, newTime)
          onMoveActivity(activeItem.activity.id, activeItem.dayNumber, toDayNumber, newTime ?? undefined, insertionIndex)
        } else {
          // Fallback if target day not found
          onMoveActivity(activeItem.activity.id, activeItem.dayNumber, toDayNumber)
        }
      }
    }

    // Handle moving activity to Ideas (Things To Do)
    if (activeItem.type === "timeline-activity" && overData?.type === "ideas-drop-zone") {
      // Only allow if activity has placeId
      if (canActivityDropToIdeas(activeItem.activity) && onMoveActivityToIdeas) {
        onMoveActivityToIdeas(activeItem.activity, activeItem.dayNumber)
      }
    }

    setActiveItem(null)
  }, [activeItem, onDropPlaceOnDay, onMoveActivity, onDropIdeaOnDay, onMoveActivityToIdeas, itinerary])

  const handleDragCancel = useCallback(() => {
    setActiveItem(null)
  }, [])

  // Calculate whether current dragged item can be dropped to Ideas
  const canDropToIdeas = activeItem?.type === "timeline-activity"
    ? canActivityDropToIdeas(activeItem.activity)
    : false

  const contextValue: CanvasDndContextValue = {
    activeItem,
    isDraggingPlace: activeItem?.type === "place",
    isDraggingSavedIdea: activeItem?.type === "saved-idea",
    isDraggingActivity: activeItem?.type === "timeline-activity",
    canDropToIdeas,
    isDesktop,
  }

  return (
    <CanvasDndReactContext.Provider value={contextValue}>
      <DndContext
        id="canvas-dnd"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}

        {/* Global Drag Overlay */}
        <DragOverlay dropAnimation={null}>
          {activeItem?.type === "place" && (
            <PlaceDragPreview place={activeItem.place} />
          )}
          {activeItem?.type === "timeline-activity" && (
            <ActivityDragPreview activity={activeItem.activity} />
          )}
          {activeItem?.type === "saved-idea" && (
            <SavedIdeaDragPreview item={activeItem.item} />
          )}
        </DragOverlay>
      </DndContext>
    </CanvasDndReactContext.Provider>
  )
}

// Preview component for dragging a place
function PlaceDragPreview({ place }: { place: Place }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-background border border-primary rounded-lg shadow-xl max-w-[280px] cursor-grabbing">
      {place.images?.[0] && (
        <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={place.images[0]}
            alt={place.name}
            fill
            sizes="48px"
            className="object-cover"
            unoptimized={place.images[0].includes("googleapis.com")}
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{place.name}</p>
        {place.rating && (
          <div className="flex items-center gap-1 mt-0.5">
            <svg className="w-3 h-3 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs">{place.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Preview component for dragging an activity
function ActivityDragPreview({ activity }: { activity: TimelineEntry }) {
  return (
    <div className="p-3 bg-background border border-primary rounded-lg shadow-xl max-w-[240px] cursor-grabbing">
      <div className="flex items-center gap-2">
        <span className="text-lg">{activity.icon || "📍"}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{activity.activity}</p>
          <p className="text-xs text-muted-foreground">{activity.time}</p>
        </div>
      </div>
    </div>
  )
}

// Preview component for dragging a saved idea
function SavedIdeaDragPreview({ item }: { item: ThingsToDoItem }) {
  const imageUrl = item.place_data.photos?.[0]?.photo_reference || null

  return (
    <div className="flex items-center gap-3 p-3 bg-background border border-primary rounded-lg shadow-xl max-w-[280px] cursor-grabbing">
      {imageUrl ? (
        <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={imageUrl}
            alt={item.place_data.name}
            fill
            sizes="48px"
            className="object-cover"
            unoptimized={imageUrl.includes("googleapis.com")}
          />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Compass className="h-5 w-5 text-primary/50" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.place_data.name}</p>
        {item.place_data.rating && (
          <div className="flex items-center gap-1 mt-0.5">
            <svg className="w-3 h-3 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs">{item.place_data.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
