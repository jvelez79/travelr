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
          className={`
            inline-flex items-center gap-1.5
            pl-2.5 pr-1 py-1
            my-1
            bg-slate-800/95
            border border-slate-500/40
            rounded-full
            text-sm
            shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]
            transition-all duration-200 ease-out
            touch-manipulation
            animate-in fade-in-0 zoom-in-95 duration-200
            hover:border-emerald-500/50 hover:bg-slate-700/95
            hover:shadow-[0_4px_12px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(255,255,255,0.08)]
            hover:-translate-y-0.5
            active:scale-[0.98]
            ${isDragging ? 'opacity-50 scale-95 rotate-2' : 'opacity-100'}
            ${isDesktop ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
          `}
          title={placeData.name}
          {...(isDesktop ? { ...attributes, ...listeners } : {})}
        >
          <button
            onClick={handleClick}
            className="inline-flex items-center gap-1.5 pointer-events-auto min-w-0 group/chip"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Category emoji */}
            <span className="text-sm leading-none flex-shrink-0 opacity-90 group-hover/chip:opacity-100 transition-opacity">{emoji}</span>

            {/* Place name */}
            <span className="font-medium text-white/95 truncate max-w-[160px] text-[13px] leading-tight group-hover/chip:text-white transition-colors">
              {placeData.name}
            </span>

            {/* Rating badge */}
            {placeData.rating && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-400/20 text-[10px] text-amber-200 font-semibold flex-shrink-0 tabular-nums border border-amber-400/10">
                <span className="text-amber-300 text-[9px]">★</span>
                <span>{placeData.rating.toFixed(1)}</span>
              </span>
            )}
          </button>

          {/* Add button */}
          <div onPointerDown={(e) => e.stopPropagation()} className="flex-shrink-0">
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
