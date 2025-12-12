"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCanvasContext } from "../CanvasContext"
import type { TimelineEntry, GeneratedPlan } from "@/types/plan"
import type { PlaceCategory } from "@/types/explore"

// Iconos que tienen una categoría de búsqueda asociada
const SEARCHABLE_ICONS: Record<string, PlaceCategory> = {
  "🍽️": "restaurants",
  "☕": "cafes",
  "🎯": "attractions",
}

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  restaurants: "restaurantes",
  cafes: "cafés",
  attractions: "atracciones",
  bars: "bares",
  museums: "museos",
  nature: "naturaleza",
}

interface ActivityDetailsProps {
  activity: TimelineEntry
  dayNumber: number
  plan: GeneratedPlan
  onUpdatePlan?: (plan: GeneratedPlan) => void
}

export function ActivityDetails({ activity, dayNumber, plan, onUpdatePlan }: ActivityDetailsProps) {
  const { clearRightPanel, openSearchToReplace } = useCanvasContext()
  const [isDeleting, setIsDeleting] = useState(false)

  // Verificar si este item puede buscar opciones
  const searchableCategory = activity.icon ? SEARCHABLE_ICONS[activity.icon] : undefined
  const canSearchOptions = !activity.placeData && searchableCategory

  const handleDelete = () => {
    if (!onUpdatePlan) return

    const updatedItinerary = plan.itinerary.map(day => {
      if (day.day !== dayNumber) return day
      return {
        ...day,
        timeline: day.timeline.filter(a => a.id !== activity.id)
      }
    })

    onUpdatePlan({
      ...plan,
      itinerary: updatedItinerary,
    })

    clearRightPanel()
  }

  const placeData = activity.placeData

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Detalles</h3>
        <button
          onClick={clearRightPanel}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Activity info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            {activity.icon && <span className="text-lg">{activity.icon}</span>}
            <h4 className="font-semibold text-lg text-foreground">{activity.activity}</h4>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {activity.time}
            </span>
            {activity.durationMinutes && (
              <span>{activity.durationMinutes} min</span>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-foreground">{activity.location}</p>
              {placeData?.address && (
                <p className="text-xs text-muted-foreground">{placeData.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Google Places data */}
        {placeData && (
          <>
            {/* Rating */}
            {placeData.rating && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(placeData.rating!) ? 'text-amber-400' : 'text-muted'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-medium">{placeData.rating}</span>
                {placeData.reviewCount && (
                  <span className="text-sm text-muted-foreground">
                    ({placeData.reviewCount} reseñas)
                  </span>
                )}
              </div>
            )}

            {/* Price level */}
            {placeData.priceLevel && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Precio:</span>
                <span className="text-sm font-medium text-foreground">
                  {'$'.repeat(placeData.priceLevel)}
                  <span className="text-muted">{'$'.repeat(4 - placeData.priceLevel)}</span>
                </span>
              </div>
            )}

            {/* Opening hours */}
            {placeData.openingHours && placeData.openingHours.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Horarios
                </h5>
                <div className="text-sm space-y-1">
                  {placeData.openingHours.slice(0, 3).map((hours, i) => (
                    <p key={i} className="text-foreground">{hours}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="space-y-2">
              {placeData.phone && (
                <a
                  href={`tel:${placeData.phone}`}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {placeData.phone}
                </a>
              )}
              {placeData.website && (
                <a
                  href={placeData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Website
                </a>
              )}
              {placeData.googleMapsUrl && (
                <a
                  href={placeData.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Ver en Google Maps
                </a>
              )}
            </div>

            {/* Images */}
            {placeData.images && placeData.images.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Fotos
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  {placeData.images.slice(0, 2).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`${activity.activity} ${i + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Notes */}
        {activity.notes && (
          <div>
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Notas
            </h5>
            <p className="text-sm text-foreground">{activity.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border space-y-2">
        {/* Buscar opciones - solo para items custom sin lugar */}
        {canSearchOptions && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => openSearchToReplace(dayNumber, activity.id, searchableCategory!)}
          >
            <Search className="w-4 h-4 mr-2" />
            Buscar {CATEGORY_LABELS[searchableCategory!]}
          </Button>
        )}

        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? 'Eliminando...' : 'Eliminar actividad'}
        </Button>
      </div>
    </div>
  )
}
