"use client"

import { useState } from "react"
import Image from "next/image"
import { Star, MapPin, Clock, Phone, Globe, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { HotelResult } from "@/lib/hotels/types"

interface HotelDetailPanelProps {
  hotel: HotelResult | null
  isOpen: boolean
  onClose: () => void
  onAddToPlan: (hotel: HotelResult) => void
  inline?: boolean
  currency?: string
}

type DetailTab = "about" | "reviews" | "photos" | "prices"

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

export function HotelDetailPanel({
  hotel,
  isOpen,
  onClose,
  onAddToPlan,
  inline = false,
  currency = "USD",
}: HotelDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("about")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (!hotel) {
    // Show empty state only in inline mode
    if (inline) {
      return (
        <div className="bg-muted/30 rounded-xl border border-border p-6 text-center h-full flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Selecciona un hotel para ver sus detalles
          </p>
        </div>
      )
    }
    return null
  }

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(hotel.name + " hotel")}`
  const googleMapsUrl = hotel.googleLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + " " + hotel.location.address)}`
  const tripadvisorUrl = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(hotel.name)}`

  // Inline mode - renders directly in flow
  if (inline) {
    return (
      <div className="bg-background rounded-xl border border-border overflow-hidden shadow-sm h-full flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          {(["About", "Reviews", "Photos", "Precios"] as const).map((tab, idx) => {
            const tabKey = ["about", "reviews", "photos", "prices"][idx] as DetailTab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tabKey)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tabKey
                    ? "text-primary border-b-2 border-primary -mb-px"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            )
          })}
          {/* Close button */}
          <button
            onClick={onClose}
            className="ml-auto mr-2 p-1.5 rounded-full hover:bg-muted transition-colors self-center"
            aria-label="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* About Tab */}
          {activeTab === "about" && (
            <div className="flex gap-4">
              {/* Left content */}
              <div className="flex-1 min-w-0">
                {/* Title with stars */}
                <div className="flex items-start gap-2">
                  <h3 className="font-semibold text-base leading-tight">{hotel.name}</h3>
                  {hotel.hotelClass && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {Array.from({ length: hotel.hotelClass }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  )}
                </div>

                {/* Type */}
                <p className="text-sm text-muted-foreground mt-1">{hotel.type}</p>

                {/* Description */}
                {hotel.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                    {hotel.description}
                  </p>
                )}

                {/* Add to plan button */}
                <Button
                  size="sm"
                  className="mt-3 bg-primary hover:bg-primary/90"
                  onClick={() => onAddToPlan(hotel)}
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar al plan
                </Button>

                {/* Rating */}
                {hotel.rating && (
                  <div className="flex items-center gap-2 mt-3">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-semibold text-amber-600">{hotel.rating.toFixed(1)}</span>
                    {hotel.reviewCount && (
                      <span className="text-sm text-muted-foreground">
                        ({hotel.reviewCount.toLocaleString()})
                      </span>
                    )}
                    <GoogleLogo className="w-4 h-4" />
                  </div>
                )}

                {/* Location */}
                <div className="flex items-start gap-2 mt-3 text-sm">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">
                    {hotel.location.address}
                    {hotel.location.area && `, ${hotel.location.area}`}
                  </span>
                </div>

                {/* Check-in/Check-out times */}
                {(hotel.checkInTime || hotel.checkOutTime) && (
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    {hotel.checkInTime && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Check-in: {hotel.checkInTime}</span>
                      </div>
                    )}
                    {hotel.checkOutTime && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Check-out: {hotel.checkOutTime}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Amenities */}
                {hotel.amenities.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1.5">Amenidades</p>
                    <div className="flex flex-wrap gap-1.5">
                      {hotel.amenities.map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-md"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Open in */}
                <div className="mt-4">
                  <span className="text-xs text-muted-foreground">Abrir en:</span>
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
                      <MapPin className="w-4 h-4 text-green-600" />
                      Google Maps
                    </a>
                  </div>
                </div>
              </div>

              {/* Right image */}
              {hotel.images[0] && (
                <div className="shrink-0 w-28 h-28 relative rounded-lg overflow-hidden">
                  <Image
                    src={hotel.images[0]}
                    alt={hotel.name}
                    fill
                    sizes="112px"
                    className="object-cover"
                    unoptimized
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
                    {hotel.rating?.toFixed(1) || "N/A"}
                  </div>
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(hotel.rating || 0)
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-300 fill-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {hotel.reviewCount?.toLocaleString() || 0} reviews
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <GoogleLogo className="w-5 h-5" />
                    <span className="text-sm font-medium">Google Reviews</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Puntuacion basada en opiniones de usuarios de Google
                  </p>
                </div>
              </div>

              {/* View reviews links */}
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
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
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
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              </div>

              {/* Tip */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Lee las opiniones mas recientes para tener una mejor idea de la experiencia actual.
                </p>
              </div>
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === "photos" && (
            <div className="space-y-3">
              {hotel.images.length > 0 ? (
                <>
                  {/* Photo grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {hotel.images.slice(0, 6).map((image, idx) => (
                      <div
                        key={idx}
                        className={`relative rounded-lg overflow-hidden ${
                          idx === 0 ? "col-span-2 h-40" : "h-24"
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${hotel.name} - Foto ${idx + 1}`}
                          fill
                          sizes={idx === 0 ? "350px" : "175px"}
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          unoptimized
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
                    Ver mas fotos en Google
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
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
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Prices Tab */}
          {activeTab === "prices" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Comparar precios</p>
                <p className="text-xs text-muted-foreground">
                  {hotel.bookingLinks.length} sitio{hotel.bookingLinks.length !== 1 ? "s" : ""}
                </p>
              </div>

              {hotel.bookingLinks.length > 0 ? (
                <div className="space-y-2">
                  {hotel.bookingLinks
                    .sort((a, b) => a.price - b.price)
                    .map((link, idx) => {
                      const isBest = idx === 0
                      return (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            isBest
                              ? "border-green-500 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {link.logo ? (
                              <img
                                src={link.logo}
                                alt={link.provider}
                                className="w-6 h-6 rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                }}
                              />
                            ) : (
                              <div className="w-6 h-6 bg-muted rounded flex items-center justify-center text-xs font-bold">
                                {link.provider[0]}
                              </div>
                            )}
                            <div>
                              <span className="text-sm font-medium">{link.provider}</span>
                              {link.deal && (
                                <span className="ml-2 text-xs text-green-600 font-medium">
                                  {link.deal}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${isBest ? "text-green-600" : ""}`}>
                              {formatCurrency(link.price)}
                            </span>
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </a>
                      )
                    })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No hay precios disponibles de otros sitios
                  </p>
                  <div className="mt-4">
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(hotel.price.perNight)}
                    </p>
                    <p className="text-xs text-muted-foreground">por noche</p>
                  </div>
                </div>
              )}

              {/* Total price info */}
              {hotel.price.total && hotel.price.total !== hotel.price.perNight && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Precio total estimado</span>
                    <span className="font-bold">{formatCurrency(hotel.price.total)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Non-inline mode is not needed for this use case
  return null
}
