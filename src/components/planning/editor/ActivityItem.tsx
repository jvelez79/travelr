"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CheckCircle2 } from "lucide-react"
import type { TimelineEntry } from "@/types/plan"
import { PlaceHoverCard } from "./PlaceHoverCard"
import { ImageCarousel } from "@/components/ui/ImageCarousel"

interface ActivityItemProps {
  activity: TimelineEntry
  onEdit: (activity: TimelineEntry) => void
  onDelete: (id: string) => void
  isDragging?: boolean
}

export function ActivityItem({ activity, onEdit, onDelete, isDragging }: ActivityItemProps) {
  const [showPlaceDetails, setShowPlaceDetails] = useState(false)
  const [showCarousel, setShowCarousel] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: activity.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dragging = isDragging || isSortableDragging

  // Check if this activity is linked to a Google Place
  const hasPlaceLink = Boolean(activity.placeId && activity.placeData)

  // Handle hover with delay to prevent flickering
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!hasPlaceLink) return
    setMousePosition({ x: e.clientX, y: e.clientY })
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPlaceDetails(true)
    }, 300)
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group flex items-center gap-3 p-3 rounded-lg border bg-card transition-all ${
        dragging
          ? "opacity-50 border-primary shadow-lg scale-105"
          : hasPlaceLink
            ? "border-border hover:border-green-500/50 border-l-2 border-l-green-500 hover:bg-muted/30"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
      }`}
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
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
        aria-label="Arrastrar actividad"
      >
        <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </button>

      {/* Time */}
      <div className="flex-shrink-0 w-20 text-sm font-medium text-muted-foreground">
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
        {activity.notes && (
          <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
            {activity.notes}
          </p>
        )}
      </div>

      {/* Google Place verified indicator */}
      {hasPlaceLink && (
        <div className="flex-shrink-0" title="Lugar verificado en Google">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        </div>
      )}

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(activity)}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          aria-label="Editar actividad"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(activity.id)}
          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
          aria-label="Eliminar actividad"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
