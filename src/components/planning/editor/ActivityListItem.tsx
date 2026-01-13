"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { useDraggable } from "@dnd-kit/core"
import type { TimelineEntry } from "@/types/plan"
import { formatDuration, estimateDuration } from "@/lib/timeUtils"
import { PlaceHoverCard } from "./PlaceHoverCard"
import { cn } from "@/lib/utils"
import { ImageCarousel } from "@/components/ui/ImageCarousel"

interface ActivityListItemProps {
  activity: TimelineEntry
  dayNumber: number
  onEdit: (activity: TimelineEntry) => void
  onDelete: (id: string) => void
  onSelect?: (activity: TimelineEntry) => void
  isSelected?: boolean
  disabled?: boolean
  enableDrag?: boolean
}

export function ActivityListItem({
  activity,
  dayNumber,
  onEdit,
  onDelete,
  onSelect,
  isSelected = false,
  disabled = false,
  enableDrag = true,
}: ActivityListItemProps) {
  const [showPlaceDetails, setShowPlaceDetails] = useState(false)
  const [showCarousel, setShowCarousel] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const duration = activity.durationMinutes ?? estimateDuration(activity.icon)

  // Check if this activity is linked to a Google Place
  const hasPlaceLink = Boolean(activity.placeId && activity.placeData)

  // Draggable setup
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `activity-${activity.id}`,
    data: {
      type: "timeline-activity",
      activity,
      dayNumber,
    },
    disabled: !enableDrag || disabled,
  })

  // Handle hover with delay to prevent flickering
  // Only capture position on initial enter, don't follow mouse
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!hasPlaceLink) return
    // Capture mouse position at entry time (fixed position for the popover)
    setMousePosition({ x: e.clientX, y: e.clientY })
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPlaceDetails(true)
    }, 200)
  }

  const handleMouseLeave = (e: React.MouseEvent) => {
    // Check if we're moving to the popover (which is rendered in a portal)
    const relatedTarget = e.relatedTarget
    if (relatedTarget && relatedTarget instanceof HTMLElement && relatedTarget.closest('[data-place-hover-card]')) {
      return // Don't hide if moving to the popover
    }

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setShowPlaceDetails(false)
  }

  const handleClick = () => {
    if (disabled) return
    if (onSelect) {
      onSelect(activity)
    }
  }

  return (
    <div
      ref={(node) => {
        containerRef.current = node
        setNodeRef(node)
      }}
      {...(enableDrag && !disabled ? { ...attributes, ...listeners } : {})}
      className={cn(
        "relative group/activity flex items-start gap-3 p-2.5 rounded-xl",
        "transition-all duration-200 ease-out",
        enableDrag && !disabled && "cursor-grab active:cursor-grabbing touch-none",
        !enableDrag && "cursor-pointer",
        isDragging
          ? "opacity-50 shadow-xl scale-95"
          : isSelected
          ? "bg-primary/8 ring-1 ring-primary/30 shadow-sm scale-[1.01]"
          : "hover:bg-muted/40 hover:shadow-md hover:scale-[1.005]",
        !isDragging && "active:scale-[0.995] active:shadow-sm"
      )}
      onClick={handleClick}
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

      {/* Timeline column with time and connector */}
      <div className="flex-shrink-0 w-14 flex flex-col items-center relative">
        {/* Time */}
        <span className="text-sm font-bold text-foreground tabular-nums tracking-tight">
          {activity.time}
        </span>
        {duration > 0 && (
          <p className="text-[10px] text-muted-foreground/60 font-medium">
            {formatDuration(duration)}
          </p>
        )}
        {/* Timeline dot */}
        <div className={cn(
          "absolute -right-1.5 top-1 w-2.5 h-2.5 rounded-full border-2 transition-colors",
          isSelected
            ? "bg-primary border-primary"
            : "bg-card border-primary/40 group-hover/activity:border-primary group-hover/activity:bg-primary/20"
        )} />
      </div>

      {/* Thumbnail - Larger and more prominent */}
      {activity.placeData?.images?.[0] ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowCarousel(true)
          }}
          className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden hover:ring-2 hover:ring-primary/40 transition-all shadow-sm"
          aria-label="Ver fotos"
        >
          <Image
            src={activity.placeData.images[0]}
            alt={activity.activity}
            width={48}
            height={48}
            className="w-full h-full object-cover"
            unoptimized={activity.placeData.images[0].includes("googleapis.com")}
          />
        </button>
      ) : activity.icon ? (
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
          <span className="text-xl">{activity.icon}</span>
        </div>
      ) : (
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      )}

      {/* Activity & Location */}
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-sm font-medium text-foreground leading-snug group-hover/activity:text-primary transition-colors">
          {activity.activity}
        </p>
        {activity.location && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {activity.location}
          </p>
        )}
        {/* Tags row - subtle metadata */}
        <div className="flex items-center gap-2 mt-1">
          {activity.isFixedTime && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600/80 dark:text-amber-400/80 font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Fija
            </span>
          )}
          {activity.placeData?.rating && (
            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-muted/50">
              <span className="text-amber-500">★</span>
              <span className="tabular-nums text-muted-foreground font-medium">{activity.placeData.rating.toFixed(1)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Actions - positioned absolutely on the right, appear on hover */}
      {!disabled && (
        <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 group-hover/activity:opacity-100 transition-opacity duration-200 bg-card/90 backdrop-blur-sm rounded-lg p-0.5 shadow-sm">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(activity)
            }}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
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
            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Eliminar actividad"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

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
