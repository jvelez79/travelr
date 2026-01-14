/**
 * SearchMapPopup Component
 *
 * Modal popup that appears when clicking on a map pin.
 * Shows place preview with image, name, rating, and add button.
 */

"use client"

import { useEffect } from "react"
import Image from "next/image"
import { X, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DaySelectorDropdown } from "@/components/ai/DaySelectorDropdown"
import type { Place } from "@/types/explore"
import type { ItineraryDay } from "@/types/plan"

interface SearchMapPopupProps {
  place: Place
  onClose: () => void
  onAddToThingsToDo: () => Promise<void>
  onAddToDay: (dayNumber: number) => Promise<void>
  days: ItineraryDay[]
  isAdded: boolean
}

export function SearchMapPopup({
  place,
  onClose,
  onAddToThingsToDo,
  onAddToDay,
  days,
  isAdded,
}: SearchMapPopupProps) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-xl shadow-xl max-w-md w-full m-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative aspect-video bg-muted">
          {place.images?.[0] ? (
            <Image
              src={place.images[0]}
              alt={place.name}
              fill
              className="object-cover rounded-t-xl"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-lg">{place.name}</h3>
          {place.subcategory && (
            <p className="text-sm text-muted-foreground mt-0.5">{place.subcategory}</p>
          )}

          {/* Rating */}
          {place.rating && (
            <div className="flex items-center gap-2 mt-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-medium">{place.rating.toFixed(1)}</span>
              {place.reviewCount && (
                <span className="text-sm text-muted-foreground">
                  ({place.reviewCount.toLocaleString()} reseñas)
                </span>
              )}
            </div>
          )}

          {/* Address */}
          {place.location.address && (
            <p className="text-sm text-muted-foreground mt-2">
              {place.location.address}
            </p>
          )}

          {/* Description */}
          {place.description && (
            <p className="text-sm mt-3 line-clamp-3">{place.description}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cerrar
            </Button>
            {!isAdded ? (
              <DaySelectorDropdown
                days={days}
                onSelectDay={onAddToDay}
                onAddToThingsToDo={onAddToThingsToDo}
                className="flex-1"
              />
            ) : (
              <Button variant="outline" disabled className="flex-1">
                Ya agregado
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
