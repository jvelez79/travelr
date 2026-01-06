"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"

interface ImageCarouselProps {
  images: string[]
  title: string
  initialIndex?: number
  onClose: () => void
  isLoading?: boolean
}

export function ImageCarousel({ images, title, initialIndex = 0, onClose, isLoading = false }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [images.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowLeft") {
        goToPrevious()
      } else if (e.key === "ArrowRight") {
        goToNext()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose, goToPrevious, goToNext])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  if (images.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-4 text-white/80 hover:text-white p-2 z-10 transition-colors"
        onClick={onClose}
        aria-label="Cerrar"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Place info */}
      <div className="absolute top-4 left-4 text-white z-10">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-white/70 flex items-center gap-2">
          {currentIndex + 1} / {images.length}
          {isLoading && (
            <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Cargando más...
            </span>
          )}
        </p>
      </div>

      {/* Previous button */}
      {images.length > 1 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 bg-black/30 hover:bg-black/50 rounded-full z-10 transition-all"
          onClick={(e) => {
            e.stopPropagation()
            goToPrevious()
          }}
          aria-label="Imagen anterior"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Image */}
      <div
        className="relative max-w-4xl max-h-[80vh] w-full h-full mx-16"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[currentIndex]}
          alt={`${title} - Imagen ${currentIndex + 1}`}
          fill
          className="object-contain"
          unoptimized={images[currentIndex].includes("googleapis.com")}
          priority
        />
      </div>

      {/* Next button */}
      {images.length > 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 bg-black/30 hover:bg-black/50 rounded-full z-10 transition-all"
          onClick={(e) => {
            e.stopPropagation()
            goToNext()
          }}
          aria-label="Imagen siguiente"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {images.map((img, idx) => (
            <button
              key={idx}
              className={`w-16 h-12 rounded overflow-hidden border-2 transition-all ${
                idx === currentIndex ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
              }`}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(idx)
              }}
              aria-label={`Ver imagen ${idx + 1}`}
            >
              <Image
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                width={64}
                height={48}
                className="object-cover w-full h-full"
                unoptimized={img.includes("googleapis.com")}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
