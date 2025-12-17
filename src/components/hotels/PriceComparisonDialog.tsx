"use client"

import { useState, useEffect } from "react"
import { ExternalLink, Loader2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PriceComparison } from "./PriceComparison"
import type { HotelResult, BookingLink } from "@/lib/hotels/types"

interface PriceComparisonDialogProps {
  hotel: HotelResult | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currency?: string
}

export function PriceComparisonDialog({
  hotel,
  open,
  onOpenChange,
  currency = "USD",
}: PriceComparisonDialogProps) {
  const [detailedBookingLinks, setDetailedBookingLinks] = useState<BookingLink[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch detailed hotel info when dialog opens to get real OTA links
  // Only fetch if we have a valid SerpAPI property token
  useEffect(() => {
    if (open && hotel?.id && hotel.hasPropertyToken) {
      setLoading(true)
      setError(null)

      fetch(`/api/hotels/${encodeURIComponent(hotel.id)}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load hotel details")
          return res.json()
        })
        .then((data) => {
          if (data.hotel?.bookingLinks?.length > 0) {
            setDetailedBookingLinks(data.hotel.bookingLinks)
          }
        })
        .catch((err) => {
          // Only log as warning (expected when property tokens expire or SerpAPI rate-limits)
          console.warn("Hotel details fetch failed, using fallback:", err.message)
          // Only show error to user if we have NO fallback booking links
          if (!hotel.bookingLinks?.length) {
            setError("No se pudieron cargar los enlaces de reserva")
          }
          // Otherwise silently use fallback booking links
        })
        .finally(() => setLoading(false))
    }
  }, [open, hotel?.id, hotel?.hasPropertyToken])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setDetailedBookingLinks(null)
      setError(null)
    }
  }, [open])

  if (!hotel) return null

  // Use detailed links if available, otherwise fallback to initial links
  const bookingLinks = detailedBookingLinks || hotel.bookingLinks

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1">{hotel.name}</h2>
              <p className="text-sm text-muted-foreground font-normal">
                {hotel.location.area || hotel.location.address}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Hotel Images */}
        {hotel.images.length > 0 && (
          <div className={`grid gap-2 -mt-2 ${hotel.images.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {hotel.images.slice(0, 2).map((img, i) => (
              <div key={i} className="aspect-4/3 overflow-hidden rounded-lg bg-muted">
                <img
                  src={img}
                  alt={`${hotel.name} - ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Hotel Details Summary */}
        <div className="grid grid-cols-3 gap-4 py-4 border-y">
          {hotel.hotelClass && (
            <div>
              <p className="text-xs text-muted-foreground">Categoría</p>
              <p className="font-semibold">{hotel.hotelClass} estrellas</p>
            </div>
          )}
          {hotel.rating && (
            <div>
              <p className="text-xs text-muted-foreground">Calificación</p>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{hotel.rating.toFixed(1)}</span>
              </div>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Desde</p>
            <p className="font-semibold text-primary">
              {formatCurrency(hotel.price.perNight)}/noche
            </p>
          </div>
        </div>

        {/* Price Comparison */}
        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Cargando ofertas...
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">{error}</p>
              <PriceComparison
                bookingLinks={hotel.bookingLinks}
                currency={currency}
              />
            </div>
          ) : (
            <PriceComparison
              bookingLinks={bookingLinks}
              currency={currency}
            />
          )}
        </div>

        {/* View on Google */}
        {hotel.googleLink && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              asChild
            >
              <a
                href={hotel.googleLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  className="w-4 h-4"
                />
                Ver más detalles en Google
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        )}

        {/* Amenities Preview */}
        {hotel.amenities.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2 text-sm">Servicios destacados</h3>
            <div className="flex flex-wrap gap-1.5">
              {hotel.amenities.slice(0, 6).map((amenity, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full"
                >
                  {amenity}
                </span>
              ))}
              {hotel.amenities.length > 6 && (
                <span className="px-2 py-1 text-muted-foreground text-xs">
                  +{hotel.amenities.length - 6} más
                </span>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
