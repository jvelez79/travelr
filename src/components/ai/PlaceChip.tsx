/**
 * PlaceChip Component
 *
 * Interactive inline chip for places mentioned in AI chat messages.
 * Displays place name with rating in a compact rounded pill format.
 * Clicking opens PlaceDetailsModal with full place details.
 *
 * Phase 4: Drag & Drop enabled (desktop only)
 */

"use client"

import { useState, useEffect, useRef } from "react"
import { useDraggable } from "@dnd-kit/core"
import { toast } from "sonner"
import type { PlaceChipData } from "@/types/ai-agent"
import type { ItineraryDay } from "@/types/plan"
import type { Place } from "@/types/explore"
import { PlaceDetailsModal } from "@/components/explore/PlaceDetailsModal"
import { PlaceChipTooltip } from "./PlaceChipTooltip"
import { DaySelectorDropdown } from "./DaySelectorDropdown"

interface PlaceChipProps {
  placeId: string
  placeData: PlaceChipData
  days?: ItineraryDay[]
  onAddToDay?: (placeId: string, dayNumber: number) => Promise<void>
  onAddToThingsToDo?: (placeId: string) => Promise<void>
}

/**
 * Get emoji icon for place category
 */
function getCategoryEmoji(category?: string): string {
  if (!category) return '📍'

  const emojiMap: Record<string, string> = {
    restaurant: '🍽️',
    restaurants: '🍽️',
    cafe: '☕',
    cafes: '☕',
    bar: '🍷',
    bars: '🍷',
    hotel: '🏨',
    lodging: '🏨',
    attraction: '🎯',
    attractions: '🎯',
    museum: '🏛️',
    museums: '🏛️',
    park: '🌳',
    nature: '🌳',
    beach: '🏖️',
    beaches: '🏖️',
    shopping: '🛍️',
    market: '🛍️',
    markets: '🛍️',
    spa: '💆',
    wellness: '💆',
    viewpoint: '🔭',
    viewpoints: '🔭',
    landmark: '🗿',
    landmarks: '🗿',
    church: '⛪',
    religious: '⛪',
  }

  return emojiMap[category.toLowerCase()] || '📍'
}

/**
 * Truncate text to max length with ellipsis
 * Using CSS truncate is preferred, this is a fallback
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 1) + '…'
}

/**
 * Convert PlaceChipData to Place format for PlaceDetailsModal
 */
function convertToPlace(placeData: PlaceChipData): Place {
  return {
    id: placeData.id,
    name: placeData.name,
    category: (placeData.category as Place['category']) || 'attractions',
    subcategory: placeData.category,
    description: placeData.description,
    location: {
      lat: placeData.location.lat,
      lng: placeData.location.lng,
      address: placeData.address,
      city: '', // Not available in PlaceChipData
      country: '', // Not available in PlaceChipData
    },
    rating: placeData.rating,
    reviewCount: placeData.reviewCount,
    priceLevel: placeData.priceLevel,
    images: placeData.imageUrl ? [placeData.imageUrl] : [],
    source: 'google',
    sourceId: placeData.id,
  }
}

export function PlaceChip({
  placeId,
  placeData,
  days = [],
  onAddToDay,
  onAddToThingsToDo,
}: PlaceChipProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isInThingsToDo, setIsInThingsToDo] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const chipRef = useRef<HTMLSpanElement>(null)

  // Detect desktop viewport (>=1024px)
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    checkIsDesktop()
    window.addEventListener("resize", checkIsDesktop)
    return () => window.removeEventListener("resize", checkIsDesktop)
  }, [])

  // Draggable setup (only enabled on desktop)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `place-chip-${placeId}`,
    data: {
      type: "place-chip",
      placeId,
      placeData,
    },
    disabled: !isDesktop, // Only enable drag on desktop
  })

  const emoji = getCategoryEmoji(placeData.category)
  const truncatedName = truncate(placeData.name, 25)

  const handleClick = () => {
    setIsModalOpen(true)
  }

  const handleAddToThingsToDo = async (_place: Place) => {
    if (onAddToThingsToDo) {
      setIsLoading(true)
      try {
        await onAddToThingsToDo(placeId)
        setIsInThingsToDo(true)
        toast.success(`Se agrego ${placeData.name} a Tu Lista`, {
          description: "Puedes encontrarlo en la seccion Things To Do"
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleAddToDay = async (_place: Place, dayNumber: number) => {
    if (onAddToDay) {
      setIsLoading(true)
      try {
        await onAddToDay(placeId, dayNumber)
        toast.success(`Se agrego ${placeData.name} al Dia ${dayNumber}`, {
          description: "Puedes verlo en tu itinerario"
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleQuickAddToThingsToDo = async () => {
    if (onAddToThingsToDo) {
      setIsLoading(true)
      try {
        await onAddToThingsToDo(placeId)
        setIsInThingsToDo(true)
        toast.success(`Se agrego ${placeData.name} a Tu Lista`, {
          description: "Puedes encontrarlo en la seccion Things To Do"
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleQuickAddToDay = async (dayNumber: number) => {
    if (onAddToDay) {
      setIsLoading(true)
      try {
        await onAddToDay(placeId, dayNumber)
        toast.success(`Se agrego ${placeData.name} al Dia ${dayNumber}`, {
          description: "Puedes verlo en tu itinerario"
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <>
      {/* Chip with Tooltip */}
      <PlaceChipTooltip placeData={placeData} isDesktop={isDesktop}>
        <span
          ref={(node) => {
            setNodeRef(node)
            if (chipRef.current) {
              chipRef.current = node
            }
          }}
          className={`inline-flex items-center gap-2 px-3 py-1.5 mx-0.5 my-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-sm font-medium transition-all touch-manipulation ${
            isDragging ? 'opacity-50 scale-95 rotate-2' : 'opacity-100 scale-100 rotate-0'
          } ${isDesktop ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
          {...(isDesktop ? { ...attributes, ...listeners } : {})}
        >
          <button
            onClick={handleClick}
            className="inline-flex items-center gap-2 pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Emoji icon */}
            <span className="text-base leading-none">{emoji}</span>

            {/* Place name */}
            <span className="truncate max-w-[180px]">{truncatedName}</span>

            {/* Rating */}
            {placeData.rating && (
              <span className="flex items-center gap-0.5 text-xs text-yellow-600 dark:text-yellow-500">
                <span>★</span>
                <span>{placeData.rating.toFixed(1)}</span>
              </span>
            )}
          </button>

          {/* Add button with dropdown */}
          <div onPointerDown={(e) => e.stopPropagation()}>
            <DaySelectorDropdown
              days={days}
              onSelectDay={handleQuickAddToDay}
              onAddToThingsToDo={handleQuickAddToThingsToDo}
              isLoading={isLoading}
            />
          </div>
        </span>
      </PlaceChipTooltip>

      {/* Modal */}
      <PlaceDetailsModal
        place={convertToPlace(placeData)}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isInThingsToDo={isInThingsToDo}
        onAddToThingsToDo={handleAddToThingsToDo}
        onAddToDay={handleAddToDay}
        days={days}
      />
    </>
  )
}
