'use client'

import { useCallback } from 'react'
import { RefreshCw, AlertCircle, Compass, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CuratedSection } from './CuratedSection'
import { CURATED_CATEGORIES } from '@/types/curated'
import type { CuratedDiscoveryResponse, CuratedPlace } from '@/types/curated'
import type { ItineraryDay } from '@/types/plan'
import { cn } from '@/lib/utils'

interface CuratedDiscoveryViewProps {
  // Data from hook
  data: CuratedDiscoveryResponse | null
  loading: boolean
  error: Error | null
  // Trip data
  destination: string | null
  days: ItineraryDay[]
  // Callbacks
  onRefresh: () => void
  onAddToThingsToDo: (place: CuratedPlace) => Promise<void>
  onAddToDay: (place: CuratedPlace, dayNumber: number) => Promise<void>
  onSelectPlace?: (place: CuratedPlace) => void
  // State
  addedPlaceIds: Set<string>
  selectedPlaceId?: string
  hoveredPlaceId?: string
  onHoverPlace?: (place: CuratedPlace | null) => void
  className?: string
}

export function CuratedDiscoveryView({
  data,
  loading,
  error,
  destination,
  days,
  onRefresh,
  onAddToThingsToDo,
  onAddToDay,
  onSelectPlace,
  addedPlaceIds,
  selectedPlaceId,
  hoveredPlaceId,
  onHoverPlace,
  className,
}: CuratedDiscoveryViewProps) {

  // Get category info by id with fallback
  const getCategoryInfo = useCallback((id: string) => {
    const category = CURATED_CATEGORIES.find((c) => c.id === id)
    // Fallback in case category not found (should never happen with hardcoded IDs)
    return category ?? {
      id: id as 'must_see_attractions',
      label: id.replace(/_/g, ' '),
      labelEn: id.replace(/_/g, ' '),
      description: '',
      icon: 'Sparkles',
    }
  }, [])

  // No destination state
  if (!destination) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Compass className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Selecciona un destino</h3>
        <p className="text-muted-foreground max-w-md">
          Para ver recomendaciones curadas, primero necesitas tener un viaje con un destino definido.
        </p>
      </div>
    )
  }

  // Loading state (initial load)
  if (loading && !data) {
    return (
      <div className={cn('space-y-12', className)}>
        {/* Header with loading indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Descubriendo {destination}...</h2>
              <p className="text-sm text-muted-foreground">
                Generando recomendaciones personalizadas con AI
              </p>
            </div>
          </div>
        </div>

        {/* Loading sections */}
        {CURATED_CATEGORIES.map((category) => (
          <CuratedSection
            key={category.id}
            category={category}
            places={[]}
            days={days}
            loading={true}
            onAddToThingsToDo={onAddToThingsToDo}
            onAddToDay={onAddToDay}
            addedPlaceIds={addedPlaceIds}
          />
        ))}
      </div>
    )
  }

  // Error state
  if (error && !data) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Error al cargar recomendaciones</h3>
        <p className="text-muted-foreground max-w-md mb-4">{error.message}</p>
        <Button onClick={onRefresh} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </Button>
      </div>
    )
  }

  // Empty data state (all categories empty)
  const totalPlaces = data
    ? data.sections.mustSeeAttractions.length +
      data.sections.outstandingRestaurants.length +
      data.sections.uniqueExperiences.length
    : 0

  if (data && totalPlaces === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Compass className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No se encontraron lugares</h3>
        <p className="text-muted-foreground max-w-md mb-4">
          No pudimos encontrar lugares con rating 4.0+ para {destination}.
          Intenta con otro destino o usa el modo explorar.
        </p>
        <Button onClick={onRefresh} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </Button>
      </div>
    )
  }

  // Success state with data
  return (
    <div className={cn('space-y-12', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Descubre {destination}</h2>
            <p className="text-sm text-muted-foreground">
              {totalPlaces} lugares curados por AI, validados con Google Places
            </p>
          </div>
        </div>

        <Button
          onClick={onRefresh}
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled={loading}
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          {loading ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>

      {/* Stats badge */}
      {data?.stats && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{data.stats.aiRecommendations} recomendaciones AI</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
          <span>{data.stats.validatedPlaces} validados</span>
          {data.stats.filteredByRating > 0 && (
            <>
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              <span>{data.stats.filteredByRating} filtrados por rating</span>
            </>
          )}
        </div>
      )}

      {/* Categories */}
      {data && (
        <>
          {/* Must-See Attractions */}
          <CuratedSection
            category={getCategoryInfo('must_see_attractions')}
            places={data.sections.mustSeeAttractions}
            days={days}
            onAddToThingsToDo={onAddToThingsToDo}
            onAddToDay={onAddToDay}
            onSelectPlace={onSelectPlace}
            addedPlaceIds={addedPlaceIds}
            selectedPlaceId={selectedPlaceId}
            hoveredPlaceId={hoveredPlaceId}
            onHoverPlace={onHoverPlace}
          />

          {/* Outstanding Restaurants */}
          <CuratedSection
            category={getCategoryInfo('outstanding_restaurants')}
            places={data.sections.outstandingRestaurants}
            days={days}
            onAddToThingsToDo={onAddToThingsToDo}
            onAddToDay={onAddToDay}
            onSelectPlace={onSelectPlace}
            addedPlaceIds={addedPlaceIds}
            selectedPlaceId={selectedPlaceId}
            hoveredPlaceId={hoveredPlaceId}
            onHoverPlace={onHoverPlace}
          />

          {/* Unique Experiences */}
          <CuratedSection
            category={getCategoryInfo('unique_experiences')}
            places={data.sections.uniqueExperiences}
            days={days}
            onAddToThingsToDo={onAddToThingsToDo}
            onAddToDay={onAddToDay}
            onSelectPlace={onSelectPlace}
            addedPlaceIds={addedPlaceIds}
            selectedPlaceId={selectedPlaceId}
            hoveredPlaceId={hoveredPlaceId}
            onHoverPlace={onHoverPlace}
          />
        </>
      )}
    </div>
  )
}
