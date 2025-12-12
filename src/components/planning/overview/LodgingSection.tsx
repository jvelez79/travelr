"use client"

import { useState } from "react"
import { Building2, Plus, Search, Calendar, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HotelSearchModal } from "@/components/hotels"
import type { AccommodationSuggestion } from "@/types/plan"
import type { HotelResult } from "@/lib/hotels/types"

interface LodgingSectionProps {
  suggestions: AccommodationSuggestion[]
  totalCost: number
  currency: string
  tripData?: {
    destination: string
    startDate: string
    endDate: string
    travelers: number
  }
  onAddHotel?: (hotel: HotelResult) => void
}

export function LodgingSection({
  suggestions,
  totalCost,
  currency,
  tripData,
  onAddHotel,
}: LodgingSectionProps) {
  const [showHotelSearch, setShowHotelSearch] = useState(false)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <section id="lodging" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Hospedaje</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Agregar hospedaje
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHotelSearch(true)}
            disabled={!tripData}
          >
            <Search className="w-4 h-4 mr-1" />
            Buscar hoteles
          </Button>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className="bg-muted/30 rounded-xl border border-dashed border-border p-8 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No hay hospedajes agregados</p>
          <p className="text-sm text-muted-foreground mt-1">
            Agrega tus reservaciones de hotel o Airbnb
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((lodging) => (
            <div
              key={lodging.id}
              className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{lodging.name}</h4>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{lodging.area}</span>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(lodging.checkIn)} — {formatDate(lodging.checkOut)}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {lodging.nights} {lodging.nights === 1 ? 'noche' : 'noches'}
                    </span>
                  </div>

                  {lodging.why && (
                    <p className="text-sm text-muted-foreground mt-3">{lodging.why}</p>
                  )}

                  {lodging.amenities && lodging.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {lodging.amenities.slice(0, 5).map((amenity, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}

                  {(lodging.checkInTime || lodging.checkOutTime) && (
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      {lodging.checkInTime && (
                        <span>Check-in: {lodging.checkInTime}</span>
                      )}
                      {lodging.checkOutTime && (
                        <span>Check-out: {lodging.checkOutTime}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right ml-4">
                  <p className="text-xl font-semibold text-primary">
                    {formatCurrency(lodging.pricePerNight * lodging.nights)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(lodging.pricePerNight)}/noche
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-muted/30 rounded-xl p-4 flex items-center justify-between">
            <span className="font-medium">Total hospedaje</span>
            <span className="text-lg font-semibold text-primary">{formatCurrency(totalCost)}</span>
          </div>
        </div>
      )}

      {/* Hotel Search Modal */}
      {tripData && (
        <HotelSearchModal
          open={showHotelSearch}
          onOpenChange={setShowHotelSearch}
          destination={tripData.destination}
          checkIn={tripData.startDate}
          checkOut={tripData.endDate}
          adults={tripData.travelers}
          currency={currency}
          onAddToPlan={onAddHotel}
        />
      )}
    </section>
  )
}
