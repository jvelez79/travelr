"use client"

import { useState, useRef, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
} from "@dnd-kit/core"
import { TimelineActivity } from "./TimelineActivity"
import { ActivityEditor } from "./ActivityEditor"
import type { TimelineEntry, ItineraryDay } from "@/types/plan"
import {
  PIXELS_PER_HOUR,
  TOTAL_HEIGHT,
  getHourLabels,
  detectConflicts,
  hasConflict,
  snapPixelsToInterval,
  pixelsToTime,
} from "@/lib/timelineUtils"
import { calculateTransportForTimeline } from "@/lib/transportUtils"

interface DayTimelineProps {
  day: ItineraryDay
  onUpdateDay: (updatedDay: ItineraryDay) => void
}

export function DayTimeline({ day, onUpdateDay }: DayTimelineProps) {
  const [editingActivity, setEditingActivity] = useState<TimelineEntry | null>(null)
  const [editorMode, setEditorMode] = useState<"edit" | "create">("edit")
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isCalculatingTransport, setIsCalculatingTransport] = useState(false)

  // Drag state
  const [activeActivity, setActiveActivity] = useState<TimelineEntry | null>(null)
  const [dropPreviewTop, setDropPreviewTop] = useState<number | null>(null)

  const timelineRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  const hourLabels = getHourLabels()
  const conflicts = detectConflicts(day.timeline)

  // Handlers for activity editing
  const handleEditActivity = (activity: TimelineEntry) => {
    setEditingActivity(activity)
    setEditorMode("edit")
    setIsEditorOpen(true)
  }

  const handleAddActivity = useCallback((clickY?: number) => {
    setEditingActivity(null)
    setEditorMode("create")
    setIsEditorOpen(true)
  }, [])

  const handleSaveActivity = async (activity: TimelineEntry) => {
    let updatedTimeline: TimelineEntry[]

    if (editorMode === "edit") {
      updatedTimeline = day.timeline.map((a) =>
        a.id === activity.id ? activity : a
      )
    } else {
      updatedTimeline = [...day.timeline, activity]
    }

    // Update immediately
    onUpdateDay({
      ...day,
      timeline: updatedTimeline,
    })

    // Calculate transport in background
    if (updatedTimeline.length >= 2) {
      setIsCalculatingTransport(true)
      try {
        const timelineWithTransport = await calculateTransportForTimeline(updatedTimeline)
        onUpdateDay({
          ...day,
          timeline: timelineWithTransport,
        })
      } finally {
        setIsCalculatingTransport(false)
      }
    }
  }

  const handleDeleteActivity = async (activityId: string) => {
    const filteredTimeline = day.timeline.filter((a) => a.id !== activityId)

    // Update immediately
    onUpdateDay({
      ...day,
      timeline: filteredTimeline,
    })

    // Recalculate transport for remaining activities
    if (filteredTimeline.length >= 2) {
      setIsCalculatingTransport(true)
      try {
        const timelineWithTransport = await calculateTransportForTimeline(filteredTimeline)
        onUpdateDay({
          ...day,
          timeline: timelineWithTransport,
        })
      } finally {
        setIsCalculatingTransport(false)
      }
    }
  }

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activity = day.timeline.find((a) => a.id === active.id)
    if (activity) {
      setActiveActivity(activity)
    }
  }

  const handleDragMove = (event: DragMoveEvent) => {
    if (!timelineRef.current || !activeActivity) return

    const { delta } = event
    const rect = timelineRef.current.getBoundingClientRect()

    // Calculate current position based on initial position + delta
    const initialTop = parseFloat(
      document.getElementById(`activity-${activeActivity.id}`)?.style.top || "0"
    )
    let newTop = (event.active.rect.current.translated?.top ?? 0) - rect.top

    // Snap to 15-minute intervals
    newTop = snapPixelsToInterval(newTop)

    // Clamp to timeline bounds
    newTop = Math.max(0, Math.min(newTop, TOTAL_HEIGHT - 30))

    setDropPreviewTop(newTop)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event

    if (!timelineRef.current || !activeActivity) {
      setActiveActivity(null)
      setDropPreviewTop(null)
      return
    }

    // Calculate new position
    const rect = timelineRef.current.getBoundingClientRect()
    const translatedY = event.active.rect.current.translated?.top ?? 0
    let newTop = translatedY - rect.top

    // Snap to 15-minute intervals
    newTop = snapPixelsToInterval(newTop)

    // Clamp to timeline bounds
    newTop = Math.max(0, Math.min(newTop, TOTAL_HEIGHT - 30))

    // Convert to time
    const newTime = pixelsToTime(newTop)

    // Update the activity with new time
    const updatedTimeline = day.timeline.map((a) =>
      a.id === activeActivity.id ? { ...a, time: newTime } : a
    )

    // Update immediately with new time
    onUpdateDay({
      ...day,
      timeline: updatedTimeline,
    })

    setActiveActivity(null)
    setDropPreviewTop(null)

    // Calculate transport in background
    if (updatedTimeline.length >= 2) {
      setIsCalculatingTransport(true)
      try {
        const timelineWithTransport = await calculateTransportForTimeline(updatedTimeline)
        onUpdateDay({
          ...day,
          timeline: timelineWithTransport,
        })
      } finally {
        setIsCalculatingTransport(false)
      }
    }
  }

  const handleDragCancel = () => {
    setActiveActivity(null)
    setDropPreviewTop(null)
  }

  // Handle click on empty timeline area to add activity
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return

    // Only handle clicks directly on the timeline (not on activities)
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains("hour-row")) {
      return
    }

    const rect = timelineRef.current.getBoundingClientRect()
    const clickY = e.clientY - rect.top
    const snappedY = snapPixelsToInterval(clickY)
    const time = pixelsToTime(snappedY)

    // Open editor with pre-filled time
    setEditingActivity({ time } as TimelineEntry)
    setEditorMode("create")
    setIsEditorOpen(true)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Scrollable timeline container */}
        <div className="max-h-[600px] overflow-y-auto">
          <div
            ref={timelineRef}
            className="relative select-none"
            style={{ height: `${TOTAL_HEIGHT}px` }}
            onClick={handleTimelineClick}
          >
            {/* Hour lines and labels */}
            {hourLabels.map(({ hour, label, top }) => (
              <div
                key={hour}
                className="hour-row absolute left-0 right-0 flex items-start"
                style={{ top: `${top}px` }}
              >
                {/* Hour label */}
                <div className="w-14 pr-2 text-right">
                  <span className="text-xs text-muted-foreground font-medium">
                    {label}
                  </span>
                </div>
                {/* Hour line */}
                <div className="flex-1 border-t border-border/50" />
              </div>
            ))}

            {/* Half-hour lines (lighter) */}
            {hourLabels.slice(0, -1).map(({ hour, top }) => (
              <div
                key={`${hour}-30`}
                className="hour-row absolute left-14 right-0 border-t border-border/20"
                style={{ top: `${top + PIXELS_PER_HOUR / 2}px` }}
              />
            ))}

            {/* Drop preview indicator */}
            {dropPreviewTop !== null && (
              <div
                className="absolute left-14 right-2 h-1 bg-primary rounded-full pointer-events-none z-40"
                style={{ top: `${dropPreviewTop}px` }}
              />
            )}

            {/* Activities */}
            {day.timeline.map((activity) => (
              <TimelineActivity
                key={activity.id}
                activity={activity}
                onEdit={handleEditActivity}
                onDelete={handleDeleteActivity}
                hasConflict={hasConflict(activity.id, conflicts)}
              />
            ))}
          </div>
        </div>

        {/* Add activity button & Transport status */}
        <div className="p-3 border-t border-border space-y-2">
          {isCalculatingTransport && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-primary animate-pulse">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Calculando rutas...
            </div>
          )}
          <button
            onClick={() => handleAddActivity()}
            className="w-full p-2 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 text-sm text-muted-foreground hover:text-primary transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Añadir actividad
          </button>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeActivity ? (
          <div className="w-64">
            <TimelineActivity
              activity={activeActivity}
              onEdit={() => {}}
              onDelete={() => {}}
              isDragOverlay
            />
          </div>
        ) : null}
      </DragOverlay>

      {/* Activity Editor Modal */}
      <ActivityEditor
        activity={editingActivity}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveActivity}
        mode={editorMode}
      />
    </DndContext>
  )
}
