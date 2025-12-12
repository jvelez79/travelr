"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Star, MapPin, Phone, Globe, Clock, ExternalLink, Image as ImageIcon } from "lucide-react"
import type { PlaceData, SavedPlace } from "@/types/plan"
import { getGoogleMapsUrl } from "@/lib/places"

interface MousePosition {
  x: number
  y: number
}

interface PlaceHoverCardProps {
  placeData?: PlaceData
  savedPlace?: SavedPlace
  className?: string
  mousePosition?: MousePosition
  onMouseLeave?: () => void
}

const CARD_WIDTH = 340 // Wider to accommodate tabs
const CARD_HEIGHT = 380 // Taller for more content
const OFFSET_X = 4
const OFFSET_Y = 4

// Google logo component
function GoogleLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

/**
 * Hover card showing Google Places data with tabs (About, Reviews, Photos).
 * Used when hovering over timeline entries or saved places that are linked to real places.
 * Accepts either PlaceData (from timeline entries) or SavedPlace (from saved places list).
 * When mousePosition is provided, renders as a portal following the mouse.
 */
export function PlaceHoverCard({ placeData, savedPlace, className = "", mousePosition, onMouseLeave }: PlaceHoverCardProps) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<"about" | "reviews" | "photos">("about")

  useEffect(() => {
    setMounted(true)
  }, [])

  // Reset tab when card closes/reopens
  useEffect(() => {
    setActiveTab("about")
  }, [placeData, savedPlace])

  // Normalize data from either source
  const data = placeData ?? savedPlace
  if (!data) return null

  const name = data.name
  const category = data.category
  const rating = data.rating
  const reviewCount = data.reviewCount
  const priceLevel = data.priceLevel
  const images = data.images
  const phone = data.phone
  const website = data.website
  const openingHours = data.openingHours

  // Handle address differences between PlaceData and SavedPlace
  const address = placeData?.address ?? savedPlace?.location?.address ?? (savedPlace?.location?.city ? `${savedPlace.location.city}${savedPlace.location.country ? `, ${savedPlace.location.country}` : ''}` : undefined)

  // Handle googleMapsUrl - PlaceData has it directly, SavedPlace needs to generate it
  const googleMapsUrl = placeData?.googleMapsUrl ?? (savedPlace ? getGoogleMapsUrl(savedPlace) : undefined)

  // Format price level
  const priceString = priceLevel ? "$".repeat(priceLevel) : null

  // Calculate position to avoid going off-screen
  const calculatePosition = () => {
    if (!mousePosition) return {}

    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1080

    let x = mousePosition.x + OFFSET_X
    let y = mousePosition.y + OFFSET_Y

    // If card would go off right edge, show on left side of cursor
    if (x + CARD_WIDTH > windowWidth - 20) {
      x = mousePosition.x - CARD_WIDTH - OFFSET_X
    }

    // If card would go off bottom edge, show above cursor
    if (y + CARD_HEIGHT > windowHeight - 20) {
      y = windowHeight - CARD_HEIGHT - 20
    }

    // Ensure it doesn't go off left edge
    if (x < 20) {
      x = 20
    }

    // Ensure it doesn't go off top edge
    if (y < 20) {
      y = 20
    }

    return {
      position: 'fixed' as const,
      left: `${x}px`,
      top: `${y}px`,
      zIndex: 9999,
    }
  }

  // Render star rating visual
  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        )
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className="w-3.5 h-3.5 text-muted-foreground/30" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
          </div>
        )
      } else {
        stars.push(
          <Star key={i} className="w-3.5 h-3.5 text-muted-foreground/30" />
        )
      }
    }
    return stars
  }

  const cardContent = (
    <div
      data-place-hover-card
      className={`
        bg-popover border rounded-xl shadow-xl overflow-hidden
        animate-in fade-in-0 zoom-in-95 duration-100
        ${className}
      `}
      style={{
        width: `${CARD_WIDTH}px`,
        ...(mousePosition ? calculatePosition() : {})
      }}
      onMouseLeave={onMouseLeave}
    >
      {/* Tabs */}
      <div className="flex border-b border-border bg-muted/30">
        {(["about", "reviews", "photos"] as const).map((tab) => (
          <button
            key={tab}
            onClick={(e) => {
              e.stopPropagation()
              setActiveTab(tab)
            }}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors capitalize ${
              activeTab === tab
                ? "text-primary border-b-2 border-primary -mb-px bg-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {tab === "about" ? "About" : tab === "reviews" ? "Reviews" : "Photos"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-h-[320px] overflow-y-auto">
        {/* ABOUT TAB */}
        {activeTab === "about" && (
          <div className="p-3 space-y-3">
            {/* Header with image */}
            <div className="flex gap-3">
              {/* Left content */}
              <div className="flex-1 min-w-0">
                {/* Name and category */}
                <h4 className="font-semibold text-sm text-foreground line-clamp-2">
                  {name}
                </h4>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">
                  {category}
                </p>

                {/* Rating */}
                {rating && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-0.5">
                      {renderStars(rating)}
                    </div>
                    <span className="text-sm font-semibold text-amber-600">{rating.toFixed(1)}</span>
                    {reviewCount && (
                      <span className="text-xs text-muted-foreground">
                        ({reviewCount.toLocaleString()})
                      </span>
                    )}
                  </div>
                )}

                {/* Price level */}
                {priceString && (
                  <span className="text-xs text-muted-foreground">{priceString}</span>
                )}
              </div>

              {/* Right image thumbnail */}
              {images && images.length > 0 && (
                <div className="flex-shrink-0 w-20 h-20 relative rounded-lg overflow-hidden bg-muted">
                  <img
                    src={images[0]}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Address */}
            {address && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{address}</span>
              </div>
            )}

            {/* Opening hours */}
            {openingHours && openingHours.length > 0 && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  {openingHours.slice(0, 3).map((hours, idx) => (
                    <div key={idx} className="line-clamp-1">{hours}</div>
                  ))}
                  {openingHours.length > 3 && (
                    <div className="text-muted-foreground/70">+{openingHours.length - 3} más</div>
                  )}
                </div>
              </div>
            )}

            {/* Phone */}
            {phone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <a
                  href={`tel:${phone}`}
                  className="hover:text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {phone}
                </a>
              </div>
            )}

            {/* Website */}
            {website && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  {website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                </a>
              </div>
            )}

            {/* External links */}
            <div className="pt-2 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground">Abrir en:</span>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-xs transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GoogleLogo className="w-3.5 h-3.5" />
                    Google Maps
                  </a>
                )}
                {website && (
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-xs transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Website
                  </a>
                )}
              </div>
            </div>

            {/* Google verification badge */}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
              <GoogleLogo className="w-3 h-3" />
              <span>Verificado en Google</span>
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === "reviews" && (
          <div className="p-3 space-y-3">
            {/* Rating summary */}
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">
                  {rating?.toFixed(1) || "N/A"}
                </div>
                {rating && (
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    {renderStars(rating)}
                  </div>
                )}
                {reviewCount && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {reviewCount.toLocaleString()} reviews
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <GoogleLogo className="w-5 h-5" />
                  <span className="text-sm font-medium">Google Reviews</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Puntuación basada en opiniones de usuarios de Google
                </p>
              </div>
            </div>

            {/* Link to Google reviews */}
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <GoogleLogo className="w-5 h-5" />
                  <span className="text-sm">Ver reseñas en Google</span>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            )}

            {/* Tip */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-xs">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-muted-foreground">
                Las reseñas te ayudan a conocer las experiencias de otros viajeros antes de visitar.
              </p>
            </div>
          </div>
        )}

        {/* PHOTOS TAB */}
        {activeTab === "photos" && (
          <div className="p-3 space-y-3">
            {images && images.length > 0 ? (
              <>
                {/* Photo grid */}
                <div className="grid grid-cols-2 gap-2">
                  {images.slice(0, 4).map((image, idx) => (
                    <div
                      key={idx}
                      className={`relative rounded-lg overflow-hidden bg-muted ${
                        idx === 0 ? "col-span-2 h-32" : "h-24"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${name} - foto ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>

                {/* View more on Google */}
                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GoogleLogo className="w-4 h-4" />
                    Ver más fotos en Google
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ImageIcon className="w-10 h-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No hay fotos disponibles</p>
                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Buscar fotos en Google
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  // If mousePosition is provided and we're mounted, render as a portal
  if (mousePosition && mounted) {
    return createPortal(cardContent, document.body)
  }

  // Otherwise render inline (backward compatible)
  return cardContent
}
