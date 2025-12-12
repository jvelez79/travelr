"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { CheckCircle2 } from "lucide-react"
import type { TimelineEntry } from "@/types/plan"
import { formatDuration, estimateDuration } from "@/lib/timeUtils"
import { getActivityPixelBounds } from "@/lib/timelineUtils"
import { PlaceHoverCard } from "./PlaceHoverCard"
import { ImageCarousel } from "@/components/ui/ImageCarousel"

interface TimelineActivityProps {
  activity: TimelineEntry
  onEdit: (activity: TimelineEntry) => void
  onDelete: (id: string) => void
  hasConflict?: boolean
  isDragOverlay?: boolean
}

export function TimelineActivity({
  activity,
  onEdit,
  onDelete,
  hasConflict = false,
  isDragOverlay = false,
}: TimelineActivityProps) {
  const [showPlaceDetails, setShowPlaceDetails] = useState(false)
  const [showCarousel, setShowCarousel] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: activity.id,
    data: {
      type: "timeline-activity",
      activity,
    },
  })

  // Check if this activity is linked to a Google Place
  const hasPlaceLink = Boolean(activity.placeId && activity.placeData)

  // Handle hover with delay to prevent flickering
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!hasPlaceLink) return
    setMousePosition({ x: e.clientX, y: e.clientY })
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPlaceDetails(true)
    }, 200)
  }

  const handleMouseLeave = (e: React.MouseEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget?.closest('[data-place-hover-card]')) {
      return
    }
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setShowPlaceDetails(false)
  }

  const { top, height } = getActivityPixelBounds(activity)
  const duration = activity.durationMinutes ?? estimateDuration(activity.icon)

  const style: React.CSSProperties = isDragOverlay
    ? {}
    : {
        position: "absolute" as const,
        top: `${top}px`,
        left: "60px", // Leave space for hour labels
        right: "8px",
        height: `${height}px`,
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : 1,
      }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group rounded-lg border transition-all overflow-hidden
        ${isDragging ? "opacity-50 shadow-xl" : ""}
        ${isDragOverlay ? "shadow-xl" : ""}
        ${hasConflict
          ? "border-destructive bg-destructive/10 border-2"
          : hasPlaceLink
            ? "border-border bg-card hover:border-green-500/50 border-l-2 border-l-green-500"
            : "border-border bg-card hover:border-primary/50"
        }
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hover card popover - fixed position near mouse entry point */}
      {showPlaceDetails && activity.placeData && (
        <PlaceHoverCard
          placeData={activity.placeData}
          mousePosition={mousePosition}
          onMouseLeave={() => setShowPlaceDetails(false)}
        />
      )}
      {/* Main content - draggable */}
      <div
        {...attributes}
        {...listeners}
        className="h-full p-2 cursor-grab active:cursor-grabbing touch-none flex flex-col"
      >
        {/* Top row: Time + Icon + Name */}
        <div className="flex items-center gap-2">
          {/* Time badge */}
          <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
            {activity.time}
          </span>

          {/* Icon or Thumbnail */}
          {activity.placeData?.images?.[0] ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowCarousel(true)
              }}
              className="flex-shrink-0 w-6 h-6 rounded overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
              aria-label="Ver fotos"
            >
              <Image
                src={activity.placeData.images[0]}
                alt={activity.activity}
                width={24}
                height={24}
                className="w-full h-full object-cover"
                unoptimized={activity.placeData.images[0].includes("googleapis.com")}
              />
            </button>
          ) : activity.icon ? (
            <span className="flex-shrink-0 text-base">{activity.icon}</span>
          ) : null}

          {/* Activity name */}
          <span className="flex-1 text-sm font-medium text-foreground truncate">
            {activity.activity}
          </span>

          {/* Google Place verified indicator */}
          {hasPlaceLink && (
            <div
              className="flex-shrink-0"
              title="Lugar verificado en Google"
            >
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
          )}

          {/* Fixed time indicator */}
          {activity.isFixedTime && (
            <span className="flex-shrink-0 text-muted-foreground" title="Hora fija">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
          )}

          {/* Conflict indicator */}
          {hasConflict && (
            <span className="flex-shrink-0 text-destructive" title="Conflicto de horario">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
          )}
        </div>

        {/* Second row: Location + Duration (if there's space) */}
        {height >= 50 && (
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {activity.location && (
              <span className="truncate">{activity.location}</span>
            )}
            {duration > 0 && (
              <span className="flex-shrink-0 ml-auto">
                {formatDuration(duration)}
              </span>
            )}
          </div>
        )}

        {/* Notes (only if block is tall enough) */}
        {height >= 80 && activity.notes && (
          <p className="mt-1 text-xs text-muted-foreground/70 line-clamp-2">
            {activity.notes}
          </p>
        )}
      </div>

      {/* Action buttons - shown on hover */}
      <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 rounded p-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit(activity)
          }}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          aria-label="Editar actividad"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(activity.id)
          }}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          aria-label="Eliminar actividad"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Image Carousel Modal */}
      {showCarousel && activity.placeData?.images && activity.placeData.images.length > 0 && (
        <ImageCarousel
          images={activity.placeData.images}
          title={activity.activity}
          onClose={() => setShowCarousel(false)}
        />
      )}
    </div>
  )
}
