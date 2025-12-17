"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import type { TimelineEntry } from "@/types/plan"
import { formatDuration, estimateDuration } from "@/lib/timeUtils"
import { PlaceHoverCard } from "./PlaceHoverCard"
import { ImageCarousel } from "@/components/ui/ImageCarousel"

interface ActivityListItemProps {
  activity: TimelineEntry
  onEdit: (activity: TimelineEntry) => void
  onDelete: (id: string) => void
  onSelect?: (activity: TimelineEntry) => void
  isSelected?: boolean
  disabled?: boolean
}

export function ActivityListItem({ activity, onEdit, onDelete, onSelect, isSelected = false, disabled = false }: ActivityListItemProps) {
  const [showPlaceDetails, setShowPlaceDetails] = useState(false)
  const [showCarousel, setShowCarousel] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const duration = activity.durationMinutes ?? estimateDuration(activity.icon)

  // Check if this activity is linked to a Google Place
  const hasPlaceLink = Boolean(activity.placeId && activity.placeData)

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
      ref={containerRef}
      className={`relative group/activity flex items-center gap-3 p-3 rounded-lg border bg-card transition-all cursor-pointer ${
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : hasPlaceLink
          ? "border-border hover:border-green-500/50 border-l-2 border-l-green-500 hover:bg-muted/30"
          : "border-border hover:border-primary/50 hover:bg-muted/30"
      }`}
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
      {/* Time */}
      <div className="flex-shrink-0 w-24 text-sm font-medium text-muted-foreground">
        {activity.time}
      </div>

      {/* Icon or Thumbnail */}
      {activity.placeData?.images?.[0] ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowCarousel(true)
          }}
          className="flex-shrink-0 w-7 h-7 rounded overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
          aria-label="Ver fotos"
        >
          <Image
            src={activity.placeData.images[0]}
            alt={activity.activity}
            width={28}
            height={28}
            className="w-full h-full object-cover"
            unoptimized={activity.placeData.images[0].includes("googleapis.com")}
          />
        </button>
      ) : activity.icon ? (
        <span className="flex-shrink-0 text-lg">{activity.icon}</span>
      ) : null}

      {/* Activity & Location */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {activity.activity}
        </p>
        {activity.location && (
          <p className="text-xs text-muted-foreground truncate">
            {activity.location}
          </p>
        )}
      </div>

      {/* Fixed time indicator */}
      {activity.isFixedTime && (
        <span className="flex-shrink-0 text-muted-foreground" title="Hora fija">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </span>
      )}

      {/* Duration badge - slides left on hover to make room for actions */}
      {duration > 0 && (
        <div className="flex-shrink-0 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground transition-transform duration-200 ease-out group-hover/activity:-translate-x-16">
          {formatDuration(duration)}
        </div>
      )}

      {/* Actions - positioned absolutely on the right, appear on hover */}
      {!disabled && (
        <div className="absolute right-3 flex items-center gap-1 opacity-0 group-hover/activity:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(activity)
            }}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label="Editar actividad"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(activity.id)
            }}
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            aria-label="Eliminar actividad"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
