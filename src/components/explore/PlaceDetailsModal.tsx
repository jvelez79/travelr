"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Star,
  MapPin,
  Clock,
  Phone,
  Globe,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Quote,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AddToDropdown } from "./AddToDropdown"
import type { Place } from "@/types/explore"
import type { CuratedPlace } from "@/types/curated"
import type { ItineraryDay } from "@/types/plan"

interface PlaceDetailsModalProps<T extends Place = Place> {
  place: T | null
  isOpen: boolean
  onClose: () => void
  isInThingsToDo: boolean
  onAddToThingsToDo: (place: T) => Promise<void>
  onAddToDay?: (place: T, dayNumber: number) => Promise<void>
  days?: ItineraryDay[]
}

// Type guard to check if place is a CuratedPlace
function isCuratedPlace(place: Place | CuratedPlace): place is CuratedPlace {
  return 'whyUnmissable' in place
}

export function PlaceDetailsModal<T extends Place = Place>({
  place,
  isOpen,
  onClose,
  isInThingsToDo,
  onAddToThingsToDo,
  onAddToDay,
  days = [],
}: PlaceDetailsModalProps<T>) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Reset image index when place changes
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [place?.id])

  if (!place) return null

  const images = place.images.length > 0 ? place.images : [null]
  const hasMultipleImages = images.length > 1

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const priceLevel = place.priceLevel ? '$'.repeat(place.priceLevel) : null

  const googleMapsUrl = place.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " " + place.location.city)}`

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto p-0"
        onInteractOutside={() => onClose()}
      >
        {/* Image carousel */}
        <div className="relative aspect-video bg-muted">
          {images[currentImageIndex] ? (
            <Image
              src={images[currentImageIndex]!}
              alt={place.name}
              fill
              className="object-cover"
              unoptimized={images[currentImageIndex]!.includes("googleapis.com")}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-16 h-16 text-muted-foreground/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Navigation arrows */}
          {hasMultipleImages && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Image counter */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}

          {/* Open now badge */}
          {place.openNow !== undefined && (
            <Badge
              className={cn(
                "absolute top-4 right-4",
                place.openNow
                  ? "bg-green-500 hover:bg-green-500"
                  : "bg-gray-800 hover:bg-gray-800"
              )}
            >
              {place.openNow ? "Open Now" : "Closed"}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">{place.name}</DialogTitle>
          </DialogHeader>

          {/* Rating and price */}
          <div className="flex items-center gap-3 mt-2">
            {place.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{place.rating.toFixed(1)}</span>
                {place.reviewCount && (
                  <span className="text-muted-foreground">
                    ({place.reviewCount.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}
            {priceLevel && (
              <span className="text-muted-foreground">{priceLevel}</span>
            )}
            {place.subcategory && (
              <Badge variant="secondary">{place.subcategory}</Badge>
            )}
          </div>

          {/* Why Unmissable - for curated places */}
          {isCuratedPlace(place) && place.whyUnmissable && (
            <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-lg">
              <div className="flex items-start gap-2">
                <Quote className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">
                  {place.whyUnmissable}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {place.description && (
            <p className="text-muted-foreground mt-4">{place.description}</p>
          )}

          {/* Details */}
          <div className="space-y-3 mt-6">
            {/* Address */}
            {place.location.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-sm">{place.location.address}</span>
              </div>
            )}

            {/* Opening hours */}
            {place.openingHours && place.openingHours.length > 0 && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm space-y-1">
                  {place.openingHours.map((hours, i) => (
                    <div key={i}>{hours}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Phone */}
            {place.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <a
                  href={`tel:${place.phone}`}
                  className="text-sm text-primary hover:underline"
                >
                  {place.phone}
                </a>
              </div>
            )}

            {/* Website */}
            {place.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Visit website
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <div className="flex-1">
              <AddToDropdown
                days={days}
                onAddToThingsToDo={async () => {
                  setIsLoading(true)
                  try {
                    await onAddToThingsToDo(place)
                    onClose()
                  } finally {
                    setIsLoading(false)
                  }
                }}
                onAddToDay={async (dayNumber) => {
                  if (onAddToDay) {
                    setIsLoading(true)
                    try {
                      await onAddToDay(place, dayNumber)
                      onClose()
                    } finally {
                      setIsLoading(false)
                    }
                  }
                }}
                isAdded={isInThingsToDo}
                isLoading={isLoading}
                variant="default"
              />
            </div>

            <Button
              variant="outline"
              asChild
            >
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Ver en Mapa
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
