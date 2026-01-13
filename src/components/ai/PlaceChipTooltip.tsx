/**
 * PlaceChipTooltip Component
 *
 * Quick preview tooltip that appears on hover (desktop only, >=1024px).
 * Shows thumbnail, name, rating, price level, and address.
 * Uses Radix UI Popover for controlled positioning.
 */

"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Star, MapPin } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { PlaceChipData } from "@/types/ai-agent"

interface PlaceChipTooltipProps {
  children: React.ReactNode
  placeData: PlaceChipData
  isDesktop: boolean
}

/**
 * Get price level string ($, $$, $$$, $$$$)
 */
function getPriceLevelString(priceLevel?: 1 | 2 | 3 | 4): string | null {
  if (!priceLevel) return null
  return "$".repeat(priceLevel)
}

export function PlaceChipTooltip({
  children,
  placeData,
  isDesktop,
}: PlaceChipTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Only enable tooltip on desktop
  if (!isDesktop) {
    return <>{children}</>
  }

  const priceLevel = getPriceLevelString(placeData.priceLevel)

  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    // Delay showing tooltip by 300ms
    timeoutRef.current = setTimeout(() => setIsOpen(true), 300)
  }

  const handleMouseLeave = () => {
    // Clear timeout if user leaves before tooltip shows
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {children}
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[280px] p-0 overflow-hidden"
        side="top"
        align="center"
        sideOffset={8}
      >
        {/* Thumbnail */}
        {placeData.imageUrl && (
          <div className="relative w-full h-[80px] bg-muted">
            <Image
              src={placeData.imageUrl}
              alt={placeData.name}
              fill
              className="object-cover"
              unoptimized={placeData.imageUrl.includes("googleapis.com")}
            />
          </div>
        )}

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Name */}
          <h4 className="font-semibold text-sm leading-tight line-clamp-2">
            {placeData.name}
          </h4>

          {/* Rating and Price */}
          <div className="flex items-center gap-2 text-xs">
            {placeData.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400" />
                <span className="font-medium">{placeData.rating.toFixed(1)}</span>
                {placeData.reviewCount && (
                  <span className="text-muted-foreground">
                    ({placeData.reviewCount.toLocaleString()})
                  </span>
                )}
              </div>
            )}
            {priceLevel && (
              <>
                {placeData.rating && <span className="text-muted-foreground">•</span>}
                <span className="text-muted-foreground">{priceLevel}</span>
              </>
            )}
          </div>

          {/* Address */}
          {placeData.address && (
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{placeData.address}</span>
            </div>
          )}

          {/* Hint */}
          <p className="text-xs text-muted-foreground text-center pt-1 border-t">
            Click para mas detalles
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
