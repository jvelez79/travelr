"use client"

import { useState } from "react"
import { Plus, Building2, Search, Upload, Mail, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UnifiedAccommodationCard } from "./UnifiedAccommodationCard"
import { AddAccommodationModal } from "./AddAccommodationModal"
import { EditAccommodationModal } from "./EditAccommodationModal"
import { HotelSearchModal } from "@/components/hotels/HotelSearchModal"
import type { GeneratedPlan } from "@/types/plan"
import type { Accommodation } from "@/types/accommodation"
import { calculateNights, createUserAccommodation, findAccommodationGaps } from "@/types/accommodation"
import type { HotelResult } from "@/lib/hotels/types"
import { cn } from "@/lib/utils"
import { formatDateShort } from "@/lib/date-utils"

interface AccommodationsViewProps {
  plan: GeneratedPlan
  onUpdatePlan: (plan: GeneratedPlan) => void
}

export function AccommodationsView({ plan, onUpdatePlan }: AccommodationsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showHotelSearch, setShowHotelSearch] = useState(false)
  const [replacingAccommodation, setReplacingAccommodation] = useState<Accommodation | null>(null)
  const [editingAccommodation, setEditingAccommodation] = useState<Accommodation | null>(null)

  // Get accommodations from plan (unified field)
  const allAccommodations = plan.accommodations || []

  // Sort by check-in date
  const sortedAccommodations = [...allAccommodations].sort((a, b) =>
    new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
  )

  // Group by status
  const suggestions = sortedAccommodations.filter(a => a.status === 'suggested')
  const pending = sortedAccommodations.filter(a => a.status === 'pending')
  const confirmed = sortedAccommodations.filter(a => a.status === 'confirmed')
  const cancelled = sortedAccommodations.filter(a => a.status === 'cancelled')

  // Find coverage gaps
  const activeAccommodations = sortedAccommodations.filter(a => a.status !== 'cancelled')
  const gaps = plan.trip?.startDate && plan.trip?.endDate
    ? findAccommodationGaps(plan.trip.startDate, plan.trip.endDate, activeAccommodations)
    : []

  // Calculate total nights covered
  const totalTripNights = plan.trip?.startDate && plan.trip?.endDate
    ? calculateNights(plan.trip.startDate, plan.trip.endDate)
    : 0
  const nightsCovered = totalTripNights - gaps.reduce((sum, gap) => {
    return sum + calculateNights(gap.startDate, gap.endDate)
  }, 0)

  // Handlers
  const updateAccommodations = (newAccommodations: Accommodation[]) => {
    onUpdatePlan({
      ...plan,
      accommodations: newAccommodations,
    })
  }

  const handleClick = (accommodation: Accommodation) => {
    // TODO: Open details panel
    console.log("View accommodation:", accommodation)
  }

  const handleEdit = (accommodation: Accommodation) => {
    setEditingAccommodation(accommodation)
  }

  const handleSaveEdit = (updated: Accommodation) => {
    const newList = allAccommodations.map(a =>
      a.id === updated.id ? updated : a
    )
    updateAccommodations(newList)
    setEditingAccommodation(null)
  }

  const handleDelete = (accommodation: Accommodation) => {
    if (!confirm(`¿Eliminar ${accommodation.name}?`)) return

    const updated = allAccommodations.filter(a => a.id !== accommodation.id)
    updateAccommodations(updated)
  }

  const handleDismiss = (accommodation: Accommodation) => {
    // For AI suggestions - just remove from list
    const updated = allAccommodations.filter(a => a.id !== accommodation.id)
    updateAccommodations(updated)
  }

  const handleMarkConfirmed = (accommodation: Accommodation) => {
    const updated = allAccommodations.map(a =>
      a.id === accommodation.id
        ? { ...a, status: 'confirmed' as const, updatedAt: new Date().toISOString() }
        : a
    )
    updateAccommodations(updated)
  }

  const handleBookNow = (accommodation: Accommodation) => {
    // Open hotel search pre-filtered to this accommodation's dates/area
    setReplacingAccommodation(accommodation)
    setShowHotelSearch(true)
  }

  const handleReplace = (accommodation: Accommodation) => {
    setReplacingAccommodation(accommodation)
    setShowHotelSearch(true)
  }

  const handleOpenHotelSearch = () => {
    setReplacingAccommodation(null)
    setShowHotelSearch(true)
  }

  const handleHotelAddToPlan = (hotel: HotelResult) => {
    const checkIn = replacingAccommodation?.checkIn || plan.trip.startDate
    const checkOut = replacingAccommodation?.checkOut || plan.trip.endDate
    const nights = calculateNights(checkIn, checkOut)

    // Map hotel type to AccommodationType
    const typeMap: Record<string, Accommodation['type']> = {
      'Hotel': 'hotel',
      'Resort': 'resort',
      'Hostel': 'hostel',
      'Apartment': 'apartment',
      'Vacation rental': 'vacation_rental',
    }

    // Create unified Accommodation
    const newAccommodation = createUserAccommodation({
      name: hotel.name,
      type: typeMap[hotel.type] || 'hotel',
      area: hotel.location.area || plan.trip.destination,
      checkIn,
      checkOut,
      pricePerNight: hotel.price.perNight,
      totalPrice: hotel.price.total,
      currency: hotel.price.currency,
      bookingPlatform: hotel.bookingLinks[0]?.provider,
      bookingUrl: hotel.bookingLinks[0]?.url,
      source: 'hotel_search',
      status: 'pending',
    })

    // Add place data if available
    if (hotel.location.lat && hotel.location.lng) {
      newAccommodation.placeData = {
        name: hotel.name,
        coordinates: { lat: hotel.location.lat, lng: hotel.location.lng },
        address: hotel.location.address,
        rating: hotel.rating,
        reviewCount: hotel.reviewCount,
        images: hotel.images,
      }
    }

    // Add amenities
    if (hotel.amenities) {
      newAccommodation.amenities = hotel.amenities
    }

    // Add check-in/out times
    if (hotel.checkInTime) newAccommodation.checkInTime = hotel.checkInTime
    if (hotel.checkOutTime) newAccommodation.checkOutTime = hotel.checkOutTime

    // If replacing, remove the old one
    let updated = allAccommodations
    if (replacingAccommodation) {
      updated = updated.filter(a => a.id !== replacingAccommodation.id)
    }
    updated = [...updated, newAccommodation]

    updateAccommodations(updated)
    setReplacingAccommodation(null)
  }

  // Handle adding new accommodation
  const handleAddAccommodation = (accommodation: Accommodation) => {
    const updated = [...allAccommodations, accommodation]
    updateAccommodations(updated)
  }

  const isEmpty = allAccommodations.length === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Alojamientos
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestiona tus reservaciones de hospedaje
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar alojamiento
        </Button>
      </div>

      {/* Coverage Indicator */}
      {totalTripNights > 0 && (
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">Cobertura de noches</span>
              {gaps.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  {gaps.length} {gaps.length === 1 ? 'noche sin cubrir' : 'noches sin cubrir'}
                </span>
              )}
            </div>
            <div className="flex gap-1">
              {Array.from({ length: totalTripNights }).map((_, i) => {
                const nightDate = new Date(plan.trip.startDate)
                nightDate.setDate(nightDate.getDate() + i)
                const dateStr = nightDate.toISOString().split('T')[0]

                const isCovered = activeAccommodations.some(a =>
                  dateStr >= a.checkIn && dateStr < a.checkOut
                )

                return (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 h-2 rounded-full transition-colors",
                      isCovered
                        ? "bg-green-500 dark:bg-green-600"
                        : "bg-amber-400 dark:bg-amber-500"
                    )}
                    title={`Noche ${i + 1}: ${formatDateShort(dateStr)} - ${isCovered ? 'Cubierta' : 'Sin cubrir'}`}
                  />
                )
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatDateShort(plan.trip.startDate)}</span>
              <span>{nightsCovered}/{totalTripNights} noches</span>
              <span>{formatDateShort(plan.trip.endDate)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Gap Warnings */}
      {gaps.length > 0 && (
        <div className="space-y-2">
          {gaps.map((gap, index) => (
            <Card key={index} className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm">
                    Sin alojamiento: {formatDateShort(gap.startDate)} - {formatDateShort(gap.endDate)}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Create temporary accommodation with gap dates so modal uses them
                    const gapAccommodation = {
                      id: `gap-${gap.startDate}`,
                      checkIn: gap.startDate,
                      checkOut: gap.endDate,
                      name: '',
                      type: 'hotel' as const,
                      area: plan.trip.destination,
                      nights: calculateNights(gap.startDate, gap.endDate),
                    } as Accommodation
                    setReplacingAccommodation(gapAccommodation)
                    setShowHotelSearch(true)
                  }}
                >
                  <Search className="h-3 w-3 mr-1" />
                  Buscar hotel
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">Sin alojamientos</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Agrega tus reservaciones de hotel, Airbnb u otro hospedaje
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="outline" onClick={handleOpenHotelSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar hoteles
                </Button>
                <Button variant="outline" onClick={() => setShowAddModal(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir recibo
                </Button>
                <Button variant="outline" onClick={() => setShowAddModal(true)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Forward email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-400">Sugerencias AI</span>
            <span>({suggestions.length})</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {suggestions.map((accommodation) => (
              <UnifiedAccommodationCard
                key={accommodation.id}
                accommodation={accommodation}
                onClick={handleClick}
                onBookNow={handleBookNow}
                onReplace={handleReplace}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Reservations */}
      {confirmed.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">Confirmados</span>
            <span>({confirmed.length})</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {confirmed.map((accommodation) => (
              <UnifiedAccommodationCard
                key={accommodation.id}
                accommodation={accommodation}
                onClick={handleClick}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReplace={handleReplace}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending Reservations */}
      {pending.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <span className="text-amber-600 dark:text-amber-400">Pendientes</span>
            <span>({pending.length})</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {pending.map((accommodation) => (
              <UnifiedAccommodationCard
                key={accommodation.id}
                accommodation={accommodation}
                onClick={handleClick}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReplace={handleReplace}
                onMarkConfirmed={handleMarkConfirmed}
              />
            ))}
          </div>
        </div>
      )}

      {/* Cancelled (collapsed/dimmed) */}
      {cancelled.length > 0 && (
        <div className="space-y-4 opacity-60">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Cancelados ({cancelled.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {cancelled.map((accommodation) => (
              <UnifiedAccommodationCard
                key={accommodation.id}
                accommodation={accommodation}
                onClick={handleClick}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Accommodation Modal */}
      <AddAccommodationModal
        tripId={plan.id}
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddAccommodation={handleAddAccommodation}
        onOpenHotelSearch={handleOpenHotelSearch}
      />

      {/* Hotel Search Modal */}
      <HotelSearchModal
        open={showHotelSearch}
        onOpenChange={(open) => {
          setShowHotelSearch(open)
          if (!open) setReplacingAccommodation(null)
        }}
        destination={plan.trip.destination}
        checkIn={replacingAccommodation?.checkIn || plan.trip.startDate}
        checkOut={replacingAccommodation?.checkOut || plan.trip.endDate}
        adults={plan.trip.travelers}
        onAddToPlan={handleHotelAddToPlan}
      />

      {/* Edit Accommodation Modal */}
      <EditAccommodationModal
        accommodation={editingAccommodation}
        open={!!editingAccommodation}
        onClose={() => setEditingAccommodation(null)}
        onSave={handleSaveEdit}
      />
    </div>
  )
}
