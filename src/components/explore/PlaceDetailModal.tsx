"use client"

import { useState, useCallback, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MapPin, Plus, Check } from "lucide-react"
import type { Place } from "@/types/explore"

interface PlaceDetailModalProps {
  place: Place | null
  isOpen: boolean
  onClose: () => void
  onAdd: (place: Place) => void
  onViewOnMap?: (place: Place) => void
  mode?: "add" | "replace"
  isAdded?: boolean
}

export function PlaceDetailModal({
  place,
  isOpen,
  onClose,
  onAdd,
  onViewOnMap,
  mode = "add",
  isAdded = false,
}: PlaceDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const handlePrevImage = useCallback(() => {
    if (!place) return
    setCurrentImageIndex((prev) =>
      prev === 0 ? place.images.length - 1 : prev - 1
    )
  }, [place])

  const handleNextImage = useCallback(() => {
    if (!place) return
    setCurrentImageIndex((prev) =>
      prev === place.images.length - 1 ? 0 : prev + 1
    )
  }, [place])

  const handleAdd = () => {
    if (place) {
      onAdd(place)
    }
  }

  const handleViewOnMap = () => {
    if (place && onViewOnMap) {
      onViewOnMap(place)
      onClose()
    }
  }

  // Reset image index when place changes
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [place?.id])

  if (!place) return null

  const hasMultipleImages = place.images.length > 1
  const currentImage = place.images[currentImageIndex] || null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="bg-slate-800 border-slate-700 p-0 gap-0 max-w-lg overflow-hidden"
        showCloseButton={false}
      >
        {/* Visually hidden title for accessibility */}
        <DialogTitle className="sr-only">{place.name}</DialogTitle>

        {/* Image Gallery */}
        <div className="relative w-full aspect-[4/3] bg-slate-900">
          {currentImage ? (
            <Image
              src={currentImage}
              alt={place.name}
              fill
              sizes="(max-width: 768px) 100vw, 512px"
              className="object-cover"
              unoptimized={currentImage.includes("googleapis.com")}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-16 h-16 text-slate-600"
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

          {/* Navigation Arrows */}
          {hasMultipleImages && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                aria-label="Siguiente imagen"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Image Counter */}
          {hasMultipleImages && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-sm font-medium">
              {currentImageIndex + 1} / {place.images.length}
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Name */}
          <h2 className="text-xl font-semibold text-white leading-tight">
            {place.name}
          </h2>

          {/* Rating and Category */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {place.rating && (
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4 text-amber-400 fill-amber-400"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-semibold text-white">
                  {place.rating.toFixed(1)}
                </span>
                {place.reviewCount && (
                  <span className="text-sm text-slate-400">
                    ({place.reviewCount.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}
            {place.subcategory && (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300 text-xs font-medium">
                {place.subcategory}
              </span>
            )}
          </div>

          {/* Description */}
          {place.description && (
            <p className="text-sm text-slate-300 mt-3 leading-relaxed">
              {place.description}
            </p>
          )}

          {/* Address */}
          {place.location.address && (
            <div className="flex items-start gap-2 mt-3 text-slate-400">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{place.location.address}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-5">
            <Button
              onClick={handleAdd}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={isAdded}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Agregado
                </>
              ) : mode === "replace" ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Seleccionar
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Things To Do
                </>
              )}
            </Button>
            {onViewOnMap && (
              <Button
                onClick={handleViewOnMap}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <MapPin className="w-4 h-4 mr-2" />
                View on Map
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
