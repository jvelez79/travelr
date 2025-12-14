"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, MapPin, CalendarPlus } from "lucide-react"
import type { Place } from "@/types/explore"
import { AccessibilityBadges } from "@/components/places/AccessibilityBadges"
import { ServingBadges } from "@/components/places/ServingBadges"

interface PlaceDetailPanelProps {
  place: Place | null
  isOpen: boolean
  onClose: () => void
  onAddToTrip: (place: Place) => void
  onSavePlace?: (place: Place) => void
  isPlaceSaved?: boolean
  inline?: boolean
  placeIndex?: number
  mode?: 'add' | 'replace'
}

// Google logo SVG component
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

// Tripadvisor logo
function TripadvisorLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="6.5" cy="12" r="3" fill="#00AA6C"/>
      <circle cx="17.5" cy="12" r="3" fill="#00AA6C"/>
      <circle cx="6.5" cy="12" r="1.5" fill="white"/>
      <circle cx="17.5" cy="12" r="1.5" fill="white"/>
      <path d="M12 6c-3 0-5.5 1.5-7 3.5h14c-1.5-2-4-3.5-7-3.5z" fill="#00AA6C"/>
      <circle cx="12" cy="5" r="1" fill="#00AA6C"/>
    </svg>
  )
}

function PriceLevel({ level }: { level?: number }) {
  if (!level) return null
  return (
    <span className="text-sm text-muted-foreground">
      {"$".repeat(level)}
      <span className="text-muted-foreground/40">{"$".repeat(4 - level)}</span>
    </span>
  )
}

export function PlaceDetailPanel({
  place,
  isOpen,
  onClose,
  onAddToTrip,
  onSavePlace,
  isPlaceSaved = false,
  inline = false,
  placeIndex,
  mode = 'add'
}: PlaceDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<"about" | "reviews" | "photos">("about")

  if (!place) {
    // Show empty state only in inline mode
    if (inline) {
      return (
        <div className="bg-muted/30 rounded-xl border border-border p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">
            Selecciona un lugar para ver sus detalles
          </p>
        </div>
      )
    }
    return null
  }

  const googleMapsUrl = place.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " " + place.location.city)}`

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(place.name + " " + place.location.city + " " + place.location.country)}`

  const tripadvisorUrl = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(place.name + " " + place.location.city)}`

  // Get category tags
  const getCategoryTags = () => {
    const tags: string[] = []
    if (place.subcategory) tags.push(place.subcategory)
    if (place.category) {
      const categoryLabels: Record<string, string> = {
        restaurants: "Restaurante",
        attractions: "Atracción",
        cafes: "Café",
        bars: "Bar",
        museums: "Museo",
        nature: "Naturaleza",
      }
      tags.push(categoryLabels[place.category] || place.category)
    }
    return tags
  }

  // Inline mode - renders directly in flow (similar to Wanderlog)
  if (inline) {
    return (
      <div className="bg-background rounded-xl border border-border overflow-hidden shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-border">
          {["About", "Reviews", "Photos"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase() as "about" | "reviews" | "photos")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.toLowerCase()
                  ? "text-primary border-b-2 border-primary -mb-px"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
          {/* Close button */}
          <button
            onClick={onClose}
            className="ml-auto mr-2 p-1.5 rounded-full hover:bg-muted transition-colors"
            aria-label="Cerrar panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[320px] overflow-y-auto">
          {/* About Tab */}
          {activeTab === "about" && (
            <div className="flex gap-4">
              {/* Left content */}
              <div className="flex-1 min-w-0">
                {/* Title with badge */}
                <div className="flex items-start gap-2">
                  {placeIndex !== undefined && (
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                      {placeIndex + 1}
                    </span>
                  )}
                  <h3 className="font-semibold text-base leading-tight">{place.name}</h3>
                </div>

                {/* Description */}
                {place.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {place.description}
                  </p>
                )}

                {/* Add to trip button */}
                {mode === 'replace' ? (
                  <Button
                    size="sm"
                    className="mt-3 bg-primary hover:bg-primary/90"
                    onClick={() => onAddToTrip(place)}
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Seleccionar
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        className="mt-3 bg-primary hover:bg-primary/90"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Add to trip
                        <ChevronDown className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuItem
                        onClick={() => onSavePlace?.(place)}
                        disabled={isPlaceSaved}
                        className="flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>{isPlaceSaved ? "Ya guardado" : "Lugares por visitar"}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onAddToTrip(place)}
                        className="flex items-center gap-2"
                      >
                        <CalendarPlus className="w-4 h-4" />
                        <span>Añadir al itinerario</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Category tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {getCategoryTags().map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Rating */}
                {place.rating && (
                  <div className="flex items-center gap-2 mt-3">
                    <svg className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-semibold text-amber-600">{place.rating.toFixed(1)}</span>
                    {place.reviewCount && (
                      <span className="text-sm text-muted-foreground">
                        ({place.reviewCount.toLocaleString()})
                      </span>
                    )}
                    <GoogleLogo className="w-4 h-4" />
                  </div>
                )}

                {/* Location */}
                <div className="flex items-start gap-2 mt-3 text-sm">
                  <svg className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-muted-foreground">
                    {place.location.address && `${place.location.address}, `}
                    {place.location.city}, {place.location.country}
                  </span>
                </div>

                {/* Opening hours */}
                {place.openingHours && place.openingHours.length > 0 && (
                  <div className="flex items-start gap-2 mt-2 text-sm">
                    <svg className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-muted-foreground">{place.openingHours[0]}</span>
                  </div>
                )}

                {/* Phone */}
                {place.phone && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${place.phone}`} className="text-primary hover:underline">
                      {place.phone}
                    </a>
                  </div>
                )}

                {/* Website */}
                {place.website && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                      {place.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  </div>
                )}

                {/* Serving options (menu) */}
                {place.servingOptions && (
                  <div className="mt-3">
                    <ServingBadges servingOptions={place.servingOptions} />
                  </div>
                )}

                {/* Accessibility */}
                {place.accessibility && (
                  <div className="mt-3">
                    <AccessibilityBadges accessibility={place.accessibility} />
                  </div>
                )}

                {/* Open in */}
                <div className="mt-4">
                  <span className="text-xs text-muted-foreground">Open in:</span>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <a
                      href={tripadvisorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-border hover:bg-muted transition-colors"
                    >
                      <TripadvisorLogo className="w-4 h-4" />
                      Tripadvisor
                    </a>
                    <a
                      href={googleSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-border hover:bg-muted transition-colors"
                    >
                      <GoogleLogo className="w-4 h-4" />
                      Google
                    </a>
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-border hover:bg-muted transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#34A853" d="M12 2C8.13 2 5 5.13 5 9c0 1.74.5 3.37 1.41 4.84.95 1.54 2.2 2.86 3.16 4.4.47.75.81 1.45 1.17 2.26.26.55.47 1.5 1.26 1.5s1-.95 1.25-1.5c.37-.81.7-1.51 1.17-2.26.96-1.53 2.21-2.85 3.16-4.4C18.5 12.37 19 10.74 19 9c0-3.87-3.13-7-7-7z"/>
                        <circle fill="#fff" cx="12" cy="9" r="2.5"/>
                      </svg>
                      Google Maps
                    </a>
                  </div>
                </div>
              </div>

              {/* Right image */}
              {place.images[0] && (
                <div className="flex-shrink-0 w-28 h-28 relative rounded-lg overflow-hidden">
                  <Image
                    src={place.images[0]}
                    alt={place.name}
                    fill
                    sizes="112px"
                    className="object-cover"
                    unoptimized={place.images[0].includes("googleapis.com")}
                  />
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="space-y-4">
              {/* Rating summary */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {place.rating?.toFixed(1) || "N/A"}
                  </div>
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(place.rating || 0)
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-300 fill-gray-300"
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {place.reviewCount?.toLocaleString() || 0} reviews
                  </div>
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

              {/* View reviews link */}
              <div className="space-y-2">
                <a
                  href={googleSearchUrl + "+reviews"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <GoogleLogo className="w-5 h-5" />
                    <span className="text-sm font-medium">Ver reviews en Google</span>
                  </div>
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <a
                  href={tripadvisorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <TripadvisorLogo className="w-5 h-5" />
                    <span className="text-sm font-medium">Ver reviews en Tripadvisor</span>
                  </div>
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              {/* Tip */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Lee las opiniones más recientes para tener una mejor idea de la experiencia actual.
                </p>
              </div>
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === "photos" && (
            <div className="space-y-3">
              {place.images.length > 0 ? (
                <>
                  {/* Photo grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {place.images.slice(0, 6).map((image, idx) => (
                      <div
                        key={idx}
                        className={`relative rounded-lg overflow-hidden ${
                          idx === 0 ? "col-span-2 h-40" : "h-24"
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${place.name} - Foto ${idx + 1}`}
                          fill
                          sizes={idx === 0 ? "350px" : "175px"}
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          unoptimized={image.includes("googleapis.com")}
                        />
                      </div>
                    ))}
                  </div>

                  {/* View more on Google */}
                  <a
                    href={googleSearchUrl + "+fotos"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
                  >
                    <GoogleLogo className="w-4 h-4" />
                    Ver más fotos en Google
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">No hay fotos disponibles</p>
                  <a
                    href={googleSearchUrl + "+fotos"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline"
                  >
                    Buscar fotos en Google
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Overlay mode (original behavior)
  return (
    <div
      className={`
        absolute inset-0 md:right-4 md:top-4 md:bottom-4 md:left-auto
        w-full md:w-96 md:max-w-[calc(100vw-2rem)]
        bg-background md:rounded-xl shadow-xl md:border md:border-border
        overflow-hidden z-10
        transition-all duration-300 ease-out
        ${isOpen ? "translate-x-0 opacity-100" : "translate-x-[calc(100%+2rem)] opacity-0 pointer-events-none"}
      `}
    >
      <div className="h-full overflow-y-auto">
        {/* Header with close button */}
        <div className="sticky top-0 z-10 flex items-center justify-end p-3 bg-background/80 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted transition-colors"
            aria-label="Cerrar panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image */}
        <div className="relative w-full h-48 bg-muted">
          {place.images[0] && (
            <Image
              src={place.images[0]}
              alt={place.name}
              fill
              sizes="384px"
              className="object-cover"
            />
          )}
          {place.subcategory && (
            <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-background/90 backdrop-blur-sm rounded-full text-xs font-medium">
              {place.subcategory}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Name and rating */}
          <h2 className="text-lg font-semibold text-foreground leading-tight">
            {place.name}
          </h2>

          <div className="flex items-center gap-3 mt-2">
            {place.rating && (
              <div className="flex items-center gap-1">
                <span className="text-amber-500">★</span>
                <span className="text-sm font-medium">{place.rating.toFixed(1)}</span>
              </div>
            )}
            {place.reviewCount && (
              <span className="text-sm text-muted-foreground">
                ({place.reviewCount.toLocaleString()})
              </span>
            )}
            <PriceLevel level={place.priceLevel} />
          </div>

          {/* Description */}
          {place.description && (
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              {place.description}
            </p>
          )}

          {/* Add to trip button */}
          <Button
            className="w-full mt-4"
            onClick={() => onAddToTrip(place)}
          >
            {mode === 'replace' ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Seleccionar
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Añadir a viaje
              </>
            )}
          </Button>

          <Separator className="my-4" />

          {/* Contact info */}
          <div className="space-y-3">
            {/* Address */}
            <div className="flex items-start gap-3">
              <svg className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm text-foreground">
                {place.location.address ? `${place.location.address}, ` : ""}
                {place.location.city}, {place.location.country}
              </span>
            </div>

            {/* Opening hours */}
            {place.openingHours && place.openingHours.length > 0 && (
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  {place.openingHours.map((hours, idx) => (
                    <div key={idx} className="text-foreground">{hours}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Phone */}
            {place.phone && (
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
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
                <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline truncate"
                >
                  {place.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              </div>
            )}

            {/* Serving options (menu) */}
            {place.servingOptions && (
              <ServingBadges servingOptions={place.servingOptions} />
            )}

            {/* Accessibility */}
            {place.accessibility && (
              <AccessibilityBadges accessibility={place.accessibility} />
            )}
          </div>

          <Separator className="my-4" />

          {/* External links */}
          <div>
            <span className="text-sm text-muted-foreground">Abrir en:</span>
            <div className="flex gap-2 mt-2">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-border hover:bg-muted transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                Google Maps
              </a>
              <a
                href={googleSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-border hover:bg-muted transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
