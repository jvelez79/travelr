"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
} from "@dnd-kit/core"
import Image from "next/image"
import type { Place } from "@/types/explore"
import type { TimelineEntry } from "@/types/plan"

// Drag data types
type DragItemType = "place" | "timeline-activity"

interface PlaceDragData {
  type: "place"
  place: Place
}

interface TimelineActivityDragData {
  type: "timeline-activity"
  activity: TimelineEntry
  dayNumber: number
}

type DragData = PlaceDragData | TimelineActivityDragData

// Context for accessing drag state
interface CanvasDndContextValue {
  activeItem: DragData | null
  isDraggingPlace: boolean
}

const CanvasDndReactContext = createContext<CanvasDndContextValue | null>(null)

function useCanvasDnd() {
  const context = useContext(CanvasDndReactContext)
  if (!context) {
    throw new Error("useCanvasDnd must be used within CanvasDndProvider")
  }
  return context
}

// Event handlers passed from parent
interface CanvasDndProviderProps {
  children: ReactNode
  onDropPlaceOnDay?: (place: Place, dayNumber: number, dropY?: number) => void
  onMoveActivity?: (activityId: string, fromDay: number, toDay: number, newTime?: string) => void
}

export function CanvasDndProvider({
  children,
  onDropPlaceOnDay,
  onMoveActivity,
}: CanvasDndProviderProps) {
  const [activeItem, setActiveItem] = useState<DragData | null>(null)

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

  const sensors = useSensors(pointerSensor, touchSensor)

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const data = active.data.current as DragData | undefined

    if (data) {
      setActiveItem(data)
    }
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

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

    // Handle moving activity between days (future enhancement)
    if (activeItem.type === "timeline-activity" && overData?.type === "day-drop-zone") {
      const toDayNumber = overData.dayNumber
      if (toDayNumber && onMoveActivity && activeItem.dayNumber !== toDayNumber) {
        onMoveActivity(activeItem.activity.id, activeItem.dayNumber, toDayNumber)
      }
    }

    setActiveItem(null)
  }, [activeItem, onDropPlaceOnDay, onMoveActivity])

  const handleDragCancel = useCallback(() => {
    setActiveItem(null)
  }, [])

  const contextValue: CanvasDndContextValue = {
    activeItem,
    isDraggingPlace: activeItem?.type === "place",
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
